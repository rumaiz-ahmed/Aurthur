# Knowledge Base

This directory contains ARTHUR's knowledge base. Each JSON file represents a knowledge entry.

## Adding Knowledge

You can add knowledge in several ways:

1. **Via command**: `brain learn <text>`
2. **Manually**: Create a JSON file with the structure below

## File Format

```json
{
  "id": "kb_1234567890",
  "text": "The user prefers dark mode in their IDE",
  "metadata": {
    "source": "user",
    "tags": ["preference", "ide"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## Tips

- Keep knowledge entries focused and specific
- Use tags to categorize knowledge
- The more specific, the better the retrieval
