import pandas as pd
import numpy as np
from scipy import stats
from scipy.stats import ttest_ind, ttest_rel, f_oneway, chi2_contingency, pearsonr, spearmanr, shapiro, levene
from statsmodels.stats.multicomp import pairwise_tukeyhsd
from statsmodels.formula.api import ols
from typing import Dict, Any, List, Tuple
import warnings

warnings.filterwarnings('ignore')

def calculate_cohens_d(group1: pd.Series, group2: pd.Series) -> float:
    """Calculate Cohen's d for effect size"""
    n1, n2 = len(group1), len(group2)
    mean1, mean2 = np.mean(group1), np.mean(group2)
    var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
    
    pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    cohens_d = (mean1 - mean2) / pooled_std
    
    return cohens_d

def interpret_cohens_d(d: float) -> str:
    """Interpret Cohen's d effect size"""
    if abs(d) < 0.2:
        return 'very small'
    elif abs(d) < 0.5:
        return 'small'
    elif abs(d) < 0.8:
        return 'medium'
    else:
        return 'large'

def independent_t_test(df: pd.DataFrame, numeric_var: str, group_var: str) -> Dict[str, Any]:
    """Perform independent t-test"""
    groups = df[group_var].unique()
    if len(groups) != 2:
        raise ValueError("Group variable must have exactly 2 categories")
    
    group1 = df[df[group_var] == groups[0]][numeric_var].dropna()
    group2 = df[df[group_var] == groups[1]][numeric_var].dropna()
    
    t_stat, p_value = ttest_ind(group1, group2, equal_var=True)
    cohens_d = calculate_cohens_d(group1, group2)
    effect_size = interpret_cohens_d(cohens_d)
    
    return {
        'test': 'independent_t_test',
        't_statistic': float(t_stat),
        'p_value': float(p_value),
        'df': len(group1) + len(group2) - 2,
        'group1': {
            'name': str(groups[0]),
            'mean': float(np.mean(group1)),
            'std': float(np.std(group1, ddof=1)),
            'n': len(group1)
        },
        'group2': {
            'name': str(groups[1]),
            'mean': float(np.mean(group2)),
            'std': float(np.std(group2, ddof=1)),
            'n': len(group2)
        },
        'effect_size': {
            'cohens_d': float(cohens_d),
            'interpretation': effect_size
        },
        'interpretation': f"Independent t-test between {groups[0]} (M={np.mean(group1):.2f}, SD={np.std(group1, ddof=1):.2f}) and {groups[1]} (M={np.mean(group2):.2f}, SD={np.std(group2, ddof=1):.2f}) showed {'a significant' if p_value < 0.05 else 'no significant'} difference, t({len(group1) + len(group2) - 2})={t_stat:.2f}, p={p_value:.3f}. Cohen's d={cohens_d:.2f} ({effect_size} effect)."
    }

def paired_t_test(df: pd.DataFrame, var1: str, var2: str) -> Dict[str, Any]:
    """Perform paired t-test"""
    paired_data = df[[var1, var2]].dropna()
    t_stat, p_value = ttest_rel(paired_data[var1], paired_data[var2])
    
    cohens_d = calculate_cohens_d(paired_data[var1], paired_data[var2])
    effect_size = interpret_cohens_d(cohens_d)
    
    return {
        'test': 'paired_t_test',
        't_statistic': float(t_stat),
        'p_value': float(p_value),
        'df': len(paired_data) - 1,
        'mean_difference': float(np.mean(paired_data[var1] - paired_data[var2])),
        'std_difference': float(np.std(paired_data[var1] - paired_data[var2], ddof=1)),
        'effect_size': {
            'cohens_d': float(cohens_d),
            'interpretation': effect_size
        },
        'interpretation': f"Paired t-test showed {'a significant' if p_value < 0.05 else 'no significant'} difference between {var1} (M={np.mean(paired_data[var1]):.2f}) and {var2} (M={np.mean(paired_data[var2]):.2f}), t({len(paired_data)-1})={t_stat:.2f}, p={p_value:.3f}. Cohen's d={cohens_d:.2f} ({effect_size} effect)."
    }

def one_way_anova(df: pd.DataFrame, numeric_var: str, group_var: str) -> Dict[str, Any]:
    """Perform one-way ANOVA with Tukey HSD post-hoc"""
    groups = df.groupby(group_var)[numeric_var].apply(list)
    f_stat, p_value = f_oneway(*groups.values)
    
    # Tukey HSD post-hoc test
    tukey = pairwise_tukeyhsd(df[numeric_var].dropna(), df[group_var].dropna())
    tukey_results = []
    for i in range(len(tukey._results_table.data)):
        if i > 0:  # Skip header row
            row = tukey._results_table.data[i]
            tukey_results.append({
                'group1': row[0],
                'group2': row[1],
                'mean_diff': float(row[2]),
                'p_value': float(row[3]),
                'reject': bool(row[4])
            })
    
    return {
        'test': 'one_way_anova',
        'f_statistic': float(f_stat),
        'p_value': float(p_value),
        'df_between': len(groups) - 1,
        'df_within': len(df) - len(groups),
        'group_means': {str(k): float(np.mean(v)) for k, v in groups.items()},
        'post_hoc': tukey_results,
        'interpretation': f"One-way ANOVA showed {'a significant' if p_value < 0.05 else 'no significant'} difference between groups, F({len(groups)-1}, {len(df)-len(groups)})={f_stat:.2f}, p={p_value:.3f}."
    }

def pearson_correlation(df: pd.DataFrame, var1: str, var2: str) -> Dict[str, Any]:
    """Perform Pearson correlation"""
    corr_data = df[[var1, var2]].dropna()
    corr, p_value = pearsonr(corr_data[var1], corr_data[var2])
    
    return {
        'test': 'pearson_correlation',
        'correlation': float(corr),
        'p_value': float(p_value),
        'n': len(corr_data),
        'interpretation': f"Pearson correlation showed {'a significant' if p_value < 0.05 else 'no significant'} relationship between {var1} and {var2}, r({len(corr_data)-2})={corr:.2f}, p={p_value:.3f}."
    }

def spearman_correlation(df: pd.DataFrame, var1: str, var2: str) -> Dict[str, Any]:
    """Perform Spearman correlation"""
    corr_data = df[[var1, var2]].dropna()
    corr, p_value = spearmanr(corr_data[var1], corr_data[var2])
    
    return {
        'test': 'spearman_correlation',
        'correlation': float(corr),
        'p_value': float(p_value),
        'n': len(corr_data),
        'interpretation': f"Spearman correlation showed {'a significant' if p_value < 0.05 else 'no significant'} relationship between {var1} and {var2}, ρ({len(corr_data)-2})={corr:.2f}, p={p_value:.3f}."
    }

def chi_square_test(df: pd.DataFrame, var1: str, var2: str) -> Dict[str, Any]:
    """Perform chi-square test of independence"""
    contingency_table = pd.crosstab(df[var1], df[var2])
    chi2, p_value, dof, expected = chi2_contingency(contingency_table)
    
    # Calculate Cramer's V
    n = contingency_table.sum().sum()
    cramers_v = np.sqrt(chi2 / (n * (min(contingency_table.shape) - 1)))
    
    return {
        'test': 'chi_square_test',
        'chi2': float(chi2),
        'p_value': float(p_value),
        'df': dof,
        'cramers_v': float(cramers_v),
        'interpretation': f"Chi-square test showed {'a significant' if p_value < 0.05 else 'no significant'} association between {var1} and {var2}, χ²({dof})={chi2:.2f}, p={p_value:.3f}, Cramer's V={cramers_v:.2f}."
    }

def shapiro_wilk_test(df: pd.DataFrame, var: str) -> Dict[str, Any]:
    """Perform Shapiro-Wilk test for normality"""
    data = df[var].dropna()
    stat, p_value = shapiro(data)
    
    return {
        'test': 'shapiro_wilk_test',
        'statistic': float(stat),
        'p_value': float(p_value),
        'n': len(data),
        'interpretation': f"Shapiro-Wilk test showed the data is {'normally distributed' if p_value > 0.05 else 'not normally distributed'}, W={stat:.2f}, p={p_value:.3f}."
    }

def levene_test(df: pd.DataFrame, numeric_var: str, group_var: str) -> Dict[str, Any]:
    """Perform Levene's test for equality of variances"""
    groups = df.groupby(group_var)[numeric_var].apply(list)
    stat, p_value = levene(*groups.values)
    
    return {
        'test': 'levene_test',
        'statistic': float(stat),
        'p_value': float(p_value),
        'interpretation': f"Levene's test showed variances are {'equal' if p_value > 0.05 else 'not equal'} across groups, W={stat:.2f}, p={p_value:.3f}."
    }

# Map test IDs to functions
TEST_FUNCTIONS = {
    'independent_t': independent_t_test,
    'paired_t': paired_t_test,
    'anova': one_way_anova,
    'pearson': pearson_correlation,
    'spearman': spearman_correlation,
    'chi_square': chi_square_test,
    'shapiro_wilk': shapiro_wilk_test,
    'levene': levene_test
}