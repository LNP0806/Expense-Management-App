const { GoogleGenerativeAI } = require("@google/generative-ai");
const AppError = require("../utils/app-error");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseTransactionFromText = async (userInput, availableCategories) => {
  if (!userInput) {
    throw new AppError("Text input is required", 400);
  }

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_AI_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const formattedCategories = availableCategories
    .map((name) => `"${name}"`)
    .join(", ");

  const prompt = `
    You are a smart financial assistant. Your job is to extract transaction details from a natural language text provided by the user.
            
            Analyze the text and extract these fields:
            - amount: The absolute number of the money spent or earned (integer).
            - type: Must be exactly 'EXPENSE' or 'INCOME'.
            - title: A short summary of the transaction in Vietnamese.
            
            CRUCIAL RULE FOR CATEGORY:
            You MUST select the value for 'predicted_category' ONLY from this strictly allowed list: [${formattedCategories}].
            If none of the categories in the list fit the transaction well, you MUST choose the closest one or "Khác". Do not invent any new category names outside this list.

            User input text: "${userInput}"

            Return a JSON object:
            {
              "amount": number,
              "type": "EXPENSE" | "INCOME",
              "predicted_category": string,
              "title": string
            }
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return JSON.parse(responseText);
};

module.exports = { parseTransactionFromText };
