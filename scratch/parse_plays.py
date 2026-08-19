import re
import os

def parse_plays(file_path, actor_prefix, output_dir):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match each play section starting with ## [number]. [Title]
    play_pattern = re.compile(r'^##\s+(\d+)\.\s+(.+?)$', re.MULTILINE)
    matches = list(play_pattern.finditer(content))
    
    print(f"Found {len(matches)} plays in {file_path}")
    os.makedirs(output_dir, exist_ok=True)

    for i, match in enumerate(matches):
        play_num = match.group(1)
        play_title = match.group(2).strip()
        start_idx = match.end()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content)
        
        body = content[start_idx:end_idx].strip()
        
        # Extract summary / when to use / table phrase
        summary_match = re.search(r'### When to use it\s*\n(.*?)(?=\n###|\Z)', body, re.DOTALL)
        summary = summary_match.group(1).strip() if summary_match else ""
        summary = re.sub(r'\s+', ' ', summary).strip()
        if len(summary) > 200:
            summary = summary[:197] + "..."
        summary = summary.replace('"', '\\"')

        table_phrase_match = re.search(r'### At the table\s*\n(.*?)(?=\n##|\Z)', body, re.DOTALL)
        table_phrase = ""
        if table_phrase_match:
            tp_text = table_phrase_match.group(1).strip()
            # Extract mechanic or verbal quote
            mech_match = re.search(r'Mechanically:\s*"([^"]+)"', tp_text)
            if mech_match:
                table_phrase = mech_match.group(1)
            else:
                first_para = tp_text.split('\n\n')[0]
                table_phrase = first_para
            table_phrase = re.sub(r'\s+', ' ', table_phrase).strip().replace('"', '\\"')

        # Detect action type
        play_type = "Action"
        body_lower = body.lower()
        if "bonus action" in body_lower[:300]:
            play_type = "Bonus Action"
        elif "reaction" in body_lower[:300]:
            play_type = "Reaction"
        elif "exploration" in body_lower[:300] or int(play_num) in range(1, 16) and actor_prefix == "C":
            play_type = "Exploration" if actor_prefix == "C" else "Action"

        actor = "joe" if actor_prefix == "J" else "cow"
        play_id = f"{actor_prefix}-{play_num}"

        # Frontmatter
        frontmatter = f"""---
title: "{play_title.replace('"', '\\"')}"
play_id: "{play_id}"
actor: "{actor}"
type: "{play_type}"
threat_tags: ["Tactical", "{actor.capitalize()}"]
summary: "{summary}"
table_phrase: "{table_phrase}"
---

{body}
"""
        filename = f"{play_id.lower()}.md"
        with open(os.path.join(output_dir, filename), 'w', encoding='utf-8') as out_f:
            out_f.write(frontmatter)

# Parse Joe's 150 plays
parse_plays('../joe/joes-greatest-hits.md', 'J', 'content/plays/joe')

# Parse Cow's 100 plays
parse_plays('../joe/mr-bigs-greatest-hits.md', 'C', 'content/plays/cow')

print("All plays re-parsed and sanitized successfully!")
