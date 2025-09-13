import { useState } from "react";
import axios from "axios";

const ContactDeveloper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleContactClick = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/contact`
      );
      setMessage(response.data.message || "Contact successful!");
    } catch (err) {
      setMessage("Failed to contact developer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleContactClick}
        disabled={isLoading}
      >
        {isLoading ? "Contacting..." : "Contact Developer"}
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
};

export default ContactDeveloper;
