import os
import openai


def main():
    """Call OpenAI to print a one-sentence description of the color of the sky."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

    openai.api_key = api_key

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You respond with exactly one concise English sentence."},
            {"role": "user", "content": "Describe the color of the sky in one sentence."},
        ],
        max_tokens=50,
        temperature=0.7,
    )

    text = response["choices"][0]["message"]["content"].strip()
    print(text)


if __name__ == "__main__":
    main()
