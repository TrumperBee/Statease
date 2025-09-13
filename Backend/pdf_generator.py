from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from weasyprint import HTML
from jinja2 import Template
from datetime import datetime
from typing import Dict, Any
import os
import io

router = APIRouter()

def generate_results_table(results: Dict[str, Any]) -> list:
    """Generate a table of results for the PDF report"""
    table = []

    if results['test'] == 'independent_t_test':
        table.extend([
            ('Test', 'Independent t-test'),
            ('Group 1', f"{results['group1']['name']} (n={results['group1']['n']})"),
            ('Group 1 Mean', f"{results['group1']['mean']:.2f}"),
            ('Group 1 SD', f"{results['group1']['std']:.2f}"),
            ('Group 2', f"{results['group2']['name']} (n={results['group2']['n']})"),
            ('Group 2 Mean', f"{results['group2']['mean']:.2f}"),
            ('Group 2 SD', f"{results['group2']['std']:.2f}"),
            ('t-value', f"{results['t_statistic']:.2f}"),
            ('Degrees of freedom', results['df']),
            ('p-value', f"{results['p_value']:.3f}"),
            ("Cohen's d", f"{results['effect_size']['cohens_d']:.2f}"),
            ('Effect size', results['effect_size']['interpretation'])
        ])

    elif results['test'] == 'paired_t_test':
        table.extend([
            ('Test', 'Paired t-test'),
            ('Mean difference', f"{results['mean_difference']:.2f}"),
            ('SD difference', f"{results['std_difference']:.2f}"),
            ('t-value', f"{results['t_statistic']:.2f}"),
            ('Degrees of freedom', results['df']),
            ('p-value', f"{results['p_value']:.3f}"),
            ("Cohen's d", f"{results['effect_size']['cohens_d']:.2f}"),
            ('Effect size', results['effect_size']['interpretation'])
        ])

    elif results['test'] == 'one_way_anova':
        table.extend([
            ('Test', 'One-way ANOVA'),
            ('F-value', f"{results['f_statistic']:.2f}"),
            ('DF between', results['df_between']),
            ('DF within', results['df_within']),
            ('p-value', f"{results['p_value']:.3f}")
        ])
        for group, mean in results['group_means'].items():
            table.append((f'Mean ({group})', f"{mean:.2f}"))

    elif results['test'] in ['pearson_correlation', 'spearman_correlation']:
        test_name = 'Pearson correlation' if results['test'] == 'pearson_correlation' else 'Spearman correlation'
        table.extend([
            ('Test', test_name),
            ('Correlation coefficient', f"{results['correlation']:.2f}"),
            ('p-value', f"{results['p_value']:.3f}"),
            ('Sample size', results['n'])
        ])

    elif results['test'] == 'chi_square_test':
        table.extend([
            ('Test', 'Chi-square test'),
            ('χ² value', f"{results['chi2']:.2f}"),
            ('Degrees of freedom', results['df']),
            ('p-value', f"{results['p_value']:.3f}"),
            ("Cramer's V", f"{results['cramers_v']:.2f}")
        ])

    elif results['test'] == 'shapiro_wilk_test':
        table.extend([
            ('Test', 'Shapiro-Wilk test'),
            ('W statistic', f"{results['statistic']:.2f}"),
            ('p-value', f"{results['p_value']:.3f}"),
            ('Sample size', results['n'])
        ])

    elif results['test'] == 'levene_test':
        table.extend([
            ('Test', "Levene's test"),
            ('W statistic', f"{results['statistic']:.2f}"),
            ('p-value', f"{results['p_value']:.3f}")
        ])

    return table


def generate_pdf_report(results: Dict[str, Any], filename: str, variables: list, group_variable: str = None) -> bytes:
    """Generate PDF report from analysis results"""
    # Load HTML template
    template_path = os.path.join(os.path.dirname(__file__), 'templates', 'report_template.html')
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()

    template = Template(template_content)

    test_names = {
        'independent_t_test': 'Independent t-test',
        'paired_t_test': 'Paired t-test',
        'one_way_anova': 'One-way ANOVA',
        'pearson_correlation': 'Pearson Correlation',
        'spearman_correlation': 'Spearman Correlation',
        'chi_square_test': 'Chi-square Test',
        'shapiro_wilk_test': 'Shapiro-Wilk Test',
        'levene_test': "Levene's Test"
    }

    template_data = {
        'test_name': test_names.get(results['test'], results['test']),
        'generation_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'filename': filename,
        'variables': variables,
        'group_variable': group_variable,
        'results_table': generate_results_table(results),
        'interpretation': results['interpretation']
    }

    html_content = template.render(**template_data)
    pdf_bytes = HTML(string=html_content).write_pdf()

    return pdf_bytes


@router.post("/export-pdf")
async def export_pdf(results: Dict[str, Any]):
    """FastAPI endpoint to export analysis results as PDF"""
    try:
        pdf_bytes = generate_pdf_report(
            results=results,
            filename="analysis_report.pdf",
            variables=results.get("variables", []),
            group_variable=results.get("group_variable")
        )

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=analysis_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
