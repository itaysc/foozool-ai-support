const sanitizeJSON = (response: string): string => {
    try {
        // Step 1: Remove markdown formatting and newlines
        let cleanedResponse = response
            .replace(/```(?:json)?\s*/gi, '') // remove ```json or ```
            .replace(/```/g, '')              // remove ending ```
            .replace(/[\r\n]+/g, ' ')         // flatten newlines
            .trim();

        // Step 2: Ensure the string is wrapped in braces if it looks like a flat object
        if (!cleanedResponse.startsWith('{')) {
            cleanedResponse = `{${cleanedResponse}`;
        }
        if (!cleanedResponse.endsWith('}')) {
            cleanedResponse = `${cleanedResponse}}`;
        }

        // Step 3: Fix unbalanced curly braces
        const openBraces = (cleanedResponse.match(/{/g) || []).length;
        const closeBraces = (cleanedResponse.match(/}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        if (missingBraces > 0) {
            cleanedResponse += '}'.repeat(missingBraces);
        }

        // Step 4: Extract the first JSON-like object
        const match = cleanedResponse.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No valid JSON object found");

        cleanedResponse = match[0];

        // Step 5: Quote unquoted keys
        cleanedResponse = cleanedResponse.replace(
            /([{,]\s*)([a-zA-Z0-9_]+)\s*:/g,
            '$1"$2":'
        );

        // Step 6: Remove trailing commas
        cleanedResponse = cleanedResponse
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');

        return cleanedResponse;
    } catch (error) {
        console.error("Error sanitizing JSON:", error);
        return '{}';
    }
};

export default sanitizeJSON;
