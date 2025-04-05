#!/usr/bin/env python3
"""
Query ML Topics - Extract topic hierarchy from markdown files
"""

import re
import json
import sys
from typing import Dict, List, Any, Optional, Tuple

def parse_markdown_file(file_path: str) -> Dict[str, Any]:
    """
    Parse a markdown file to extract topics hierarchically
    
    Returns a structured dictionary with the topic hierarchy
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.readlines()
            
        # Initialize the structure
        topic_tree = {
            "main_topic": "",
            "sections": []
        }
        
        current_section = None
        current_topic = None
        current_subtopic = None
        current_sub_subtopic = None
        
        for line in content:
            line = line.rstrip()
            
            # Skip empty lines
            if not line:
                continue
                
            # Main title (# Title)
            if line.startswith('# '):
                topic_tree["main_topic"] = line[2:].strip()
                
            # Section (## Section)
            elif line.startswith('## '):
                section_name = line[3:].strip()
                current_section = {
                    "name": section_name,
                    "topics": []
                }
                topic_tree["sections"].append(current_section)
                current_topic = None
                current_subtopic = None
                current_sub_subtopic = None
            
            # Handle bullet points with different indentation levels
            elif re.match(r'^(\s*)-\s+', line):
                indent_level = len(re.match(r'^(\s*)', line).group(1))
                text = re.sub(r'^(\s*)-\s+', '', line).strip()
                
                # Check if there's a colon followed by more content
                if ':' in text:
                    base_text = text.split(':', 1)[0].strip()
                    # Keep the colon for display purposes
                    display_text = text
                else:
                    base_text = text
                    display_text = text
                
                # Top-level topic (no indent or minimal indent)
                if indent_level < 2:
                    if current_section:
                        current_topic = {
                            "name": display_text,
                            "subtopics": []
                        }
                        current_section["topics"].append(current_topic)
                        current_subtopic = None
                        current_sub_subtopic = None
                
                # Subtopic (2-3 spaces indent)
                elif 2 <= indent_level <= 3:
                    if current_topic:
                        current_subtopic = {
                            "name": display_text,
                            "sub_subtopics": []
                        }
                        current_topic["subtopics"].append(current_subtopic)
                        current_sub_subtopic = None
                    # Handle case where subtopic is directly under section (no topic)
                    elif current_section and not current_topic:
                        # Create an "unnamed" topic to hold this subtopic
                        current_topic = {
                            "name": "(Direct subtopics)",
                            "subtopics": []
                        }
                        current_section["topics"].append(current_topic)
                        
                        current_subtopic = {
                            "name": display_text,
                            "sub_subtopics": []
                        }
                        current_topic["subtopics"].append(current_subtopic)
                
                # Sub-subtopic (4+ spaces indent)
                elif indent_level >= 4:
                    # Determine if it's a sub-subtopic or deeper level
                    if current_subtopic:
                        current_sub_subtopic = {
                            "name": display_text
                        }
                        current_subtopic["sub_subtopics"].append(current_sub_subtopic)
                    # Handle direct addition to topic if no subtopic exists
                    elif current_topic and not current_subtopic:
                        current_subtopic = {
                            "name": "(Direct items)",
                            "sub_subtopics": []
                        }
                        current_topic["subtopics"].append(current_subtopic)
                        
                        current_sub_subtopic = {
                            "name": display_text
                        }
                        current_subtopic["sub_subtopics"].append(current_sub_subtopic)
                
        return topic_tree
                
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return {"error": str(e)}

def print_topic_tree(topic_tree: Dict[str, Any], format: str = "text"):
    """
    Print the topic tree in the specified format
    """
    if format == "json":
        print(json.dumps(topic_tree, indent=2))
        return
    
    # Text format (default)
    print(f"Main Topic: {topic_tree['main_topic']}\n")
    
    for i, section in enumerate(topic_tree["sections"], 1):
        print(f"{i}. {section['name']}")
        
        for j, topic in enumerate(section["topics"], 1):
            print(f"   {i}.{j}. {topic['name']}")
            
            for k, subtopic in enumerate(topic["subtopics"], 1):
                print(f"      {i}.{j}.{k}. {subtopic['name']}")
                
                for l, sub_subtopic in enumerate(subtopic.get("sub_subtopics", []), 1):
                    print(f"         {i}.{j}.{k}.{l}. {sub_subtopic['name']}")

def query_topics(topic_tree: Dict[str, Any], query: str) -> List[Dict[str, Any]]:
    """
    Search for topics matching the query
    """
    results = []
    query = query.lower()
    
    # Check main topic
    if query in topic_tree["main_topic"].lower():
        results.append({
            "type": "main_topic",
            "name": topic_tree["main_topic"],
            "path": topic_tree["main_topic"]
        })
    
    # Check sections, topics, subtopics, and sub-subtopics
    for section in topic_tree["sections"]:
        section_name = section["name"]
        
        if query in section_name.lower():
            results.append({
                "type": "section",
                "name": section_name,
                "path": f"{topic_tree['main_topic']} > {section_name}"
            })
        
        for topic in section["topics"]:
            topic_name = topic["name"]
            
            if query in topic_name.lower():
                results.append({
                    "type": "topic",
                    "name": topic_name,
                    "path": f"{topic_tree['main_topic']} > {section_name} > {topic_name}"
                })
            
            for subtopic in topic["subtopics"]:
                subtopic_name = subtopic["name"]
                
                if query in subtopic_name.lower():
                    results.append({
                        "type": "subtopic",
                        "name": subtopic_name,
                        "path": f"{topic_tree['main_topic']} > {section_name} > {topic_name} > {subtopic_name}"
                    })
                
                for sub_subtopic in subtopic.get("sub_subtopics", []):
                    sub_subtopic_name = sub_subtopic["name"]
                    
                    if query in sub_subtopic_name.lower():
                        results.append({
                            "type": "sub_subtopic",
                            "name": sub_subtopic_name,
                            "path": f"{topic_tree['main_topic']} > {section_name} > {topic_name} > {subtopic_name} > {sub_subtopic_name}"
                        })
    
    return results

def main():
    """
    Main function to parse and query markdown files
    """
    if len(sys.argv) < 2:
        print("Usage: python query_ml_topics.py [file_path] [query] [format]")
        print("Examples:")
        print("  python query_ml_topics.py ml.md                   # Print full topic tree in text format")
        print("  python query_ml_topics.py ml.md Neural json       # Search for 'Neural' and output in JSON")
        print("  python query_ml_topics.py ml.md \"Deep Learning\"   # Search for 'Deep Learning'")
        return
    
    file_path = sys.argv[1]
    query = sys.argv[2] if len(sys.argv) > 2 else None
    output_format = sys.argv[3] if len(sys.argv) > 3 else "text"
    
    topic_tree = parse_markdown_file(file_path)
    
    if "error" in topic_tree:
        print(f"Error: {topic_tree['error']}")
        return
    
    if query:
        results = query_topics(topic_tree, query)
        
        if output_format == "json":
            print(json.dumps(results, indent=2))
        else:
            print(f"Search results for '{query}':")
            if not results:
                print("  No results found")
            for i, result in enumerate(results, 1):
                print(f"{i}. [{result['type']}] {result['name']}")
                print(f"   Path: {result['path']}")
                print()
    else:
        print_topic_tree(topic_tree, output_format)

if __name__ == "__main__":
    main() 