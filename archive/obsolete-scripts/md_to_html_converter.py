#!/usr/bin/env python3
"""
Markdown to HTML Converter for Voice Agent Documentation
Converts Voice Agent documentation from Markdown to HTML format for ElevenLabs knowledge base.
"""

import re
import sys
from pathlib import Path

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; color: #333; background: #f9f9f9; }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-top: 30px; }}
        h2 {{ color: #34495e; border-bottom: 2px solid #95a5a6; padding-bottom: 8px; margin-top: 40px; }}
        h3 {{ color: #555; margin-top: 30px; }}
        h4 {{ color: #666; margin-top: 20px; }}
        code {{ background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; color: #c7254e; }}
        pre {{ background: #2d2d2d; color: #f8f8f2; padding: 15px; border-left: 4px solid #3498db; overflow-x: auto; border-radius: 5px; }}
        pre code {{ background: transparent; color: #f8f8f2; padding: 0; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background: #3498db; color: white; font-weight: 600; }}
        tr:nth-child(even) {{ background: #f9f9f9; }}
        tr:hover {{ background: #f0f0f0; }}
        ul, ol {{ margin: 10px 0; padding-left: 30px; }}
        li {{ margin: 5px 0; }}
        .toc {{ background: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db; }}
        .toc ul {{ list-style: none; padding-left: 10px; }}
        .toc a {{ text-decoration: none; color: #3498db; font-weight: 500; }}
        .toc a:hover {{ text-decoration: underline; color: #2980b9; }}
        blockquote {{ border-left: 4px solid #3498db; padding-left: 20px; margin: 20px 0; font-style: italic; color: #555; background: #f7f9fa; padding: 10px 20px; }}
        .metadata {{ background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }}
        .metadata strong {{ color: #2c3e50; }}
        .workflow-section {{ background: white; padding: 20px; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        hr {{ border: none; border-top: 2px solid #ecf0f1; margin: 40px 0; }}
        strong {{ color: #2c3e50; }}
        .step-list {{ background: #f0f7ff; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db; }}
    </style>
</head>
<body>
{content}
</body>
</html>
"""

def escape_html(text):
    """Escape HTML special characters."""
    return (text
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;'))

def convert_markdown_to_html(md_content, title):
    """Convert markdown content to HTML."""
    html_lines = []
    in_code_block = False
    in_table = False
    code_block_lines = []
    table_lines = []

    lines = md_content.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i]

        # Code blocks
        if line.strip().startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_block_lines = []
            else:
                in_code_block = False
                code_content = '\n'.join(code_block_lines)
                html_lines.append(f'<pre><code>{escape_html(code_content)}</code></pre>')
                code_block_lines = []
            i += 1
            continue

        if in_code_block:
            code_block_lines.append(line)
            i += 1
            continue

        # Tables
        if '|' in line and line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(line)
            i += 1
            continue
        elif in_table and not ('|' in line):
            in_table = False
            html_lines.append(convert_table(table_lines))
            table_lines = []

        # Headers
        if line.startswith('# '):
            html_lines.append(f'<h1>{escape_html(line[2:])}</h1>')
        elif line.startswith('## '):
            text = line[3:]
            anchor = text.lower().replace(' ', '-').replace('&', '').replace('/', '').replace('(', '').replace(')', '')
            html_lines.append(f'<h2 id="{anchor}">{escape_html(text)}</h2>')
        elif line.startswith('### '):
            text = line[4:]
            anchor = text.lower().replace(' ', '-').replace('&', '').replace('/', '').replace('(', '').replace(')', '')
            html_lines.append(f'<h3 id="{anchor}">{escape_html(text)}</h3>')
        elif line.startswith('#### '):
            html_lines.append(f'<h4>{escape_html(line[5:])}</h4>')

        # Horizontal rules
        elif line.strip() == '---':
            html_lines.append('<hr>')

        # Lists
        elif line.strip().startswith('- '):
            if i == 0 or not lines[i-1].strip().startswith('- '):
                html_lines.append('<ul>')
            html_lines.append(f'<li>{process_inline_markdown(line.strip()[2:])}</li>')
            if i == len(lines) - 1 or not lines[i+1].strip().startswith('- '):
                html_lines.append('</ul>')

        elif re.match(r'^\d+\. ', line.strip()):
            if i == 0 or not re.match(r'^\d+\. ', lines[i-1].strip()):
                html_lines.append('<ol>')
            text = re.sub(r'^\d+\. ', '', line.strip())
            html_lines.append(f'<li>{process_inline_markdown(text)}</li>')
            if i == len(lines) - 1 or not re.match(r'^\d+\. ', lines[i+1].strip()):
                html_lines.append('</ol>')

        # Blockquotes
        elif line.strip().startswith('> '):
            html_lines.append(f'<blockquote>{process_inline_markdown(line.strip()[2:])}</blockquote>')

        # Paragraphs
        elif line.strip():
            html_lines.append(f'<p>{process_inline_markdown(line)}</p>')
        else:
            html_lines.append('')

        i += 1

    if in_table:
        html_lines.append(convert_table(table_lines))

    return '\n'.join(html_lines)

def process_inline_markdown(text):
    """Process inline markdown (bold, italic, code, links)."""
    # Escape HTML first
    text = escape_html(text)

    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)

    # Italic
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)

    # Inline code
    text = re.sub(r'`(.+?)`', r'<code>\1</code>', text)

    # Links
    text = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', text)

    return text

def convert_table(table_lines):
    """Convert markdown table to HTML."""
    if len(table_lines) < 2:
        return ''

    html = '<table>\n'

    # Header row
    header_cells = [cell.strip() for cell in table_lines[0].split('|')[1:-1]]
    html += '<tr>\n'
    for cell in header_cells:
        html += f'<th>{process_inline_markdown(cell)}</th>\n'
    html += '</tr>\n'

    # Data rows (skip separator row at index 1)
    for line in table_lines[2:]:
        if not line.strip():
            continue
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        html += '<tr>\n'
        for cell in cells:
            html += f'<td>{process_inline_markdown(cell)}</td>\n'
        html += '</tr>\n'

    html += '</table>'
    return html

def extract_title(md_content):
    """Extract title from first H1 in markdown."""
    for line in md_content.split('\n'):
        if line.startswith('# '):
            return line[2:].strip()
    return "Voice Agent Documentation"

def main():
    if len(sys.argv) < 2:
        print("Usage: python md_to_html_converter.py <input.md> [output.html]")
        sys.exit(1)

    input_file = Path(sys.argv[1])
    if not input_file.exists():
        print(f"Error: File {input_file} not found")
        sys.exit(1)

    output_file = Path(sys.argv[2]) if len(sys.argv) > 2 else input_file.with_suffix('.html')

    # Read markdown content
    with open(input_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Extract title
    title = extract_title(md_content)

    # Convert to HTML
    html_content = convert_markdown_to_html(md_content, title)

    # Wrap in template
    full_html = HTML_TEMPLATE.format(title=title, content=html_content)

    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(full_html)

    print(f"Converted {input_file} to {output_file}")
    print(f"File size: {output_file.stat().st_size / 1024:.1f} KB")

if __name__ == '__main__':
    main()
