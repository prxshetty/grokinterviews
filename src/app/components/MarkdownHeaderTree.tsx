"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './TopicTreeNavigation.module.css';

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface MarkdownHeader {
  id: string;
  label: string;
  content?: string;
}

interface MarkdownHeaderTreeProps {
  topicId: string;
  onSelectHeader: (headerId: string) => void;
}

const MarkdownHeaderTree: React.FC<MarkdownHeaderTreeProps> = ({ topicId, onSelectHeader }) => {
  const [headers, setHeaders] = useState<MarkdownHeader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHeader, setSelectedHeader] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch markdown headers and related categories from Supabase
  useEffect(() => {
    const fetchHeadersAndCategories = async () => {
      try {
        setLoading(true);
        console.log(`MarkdownHeaderTree - Fetching headers for ${topicId}`);

        // Fetch the markdown headers directly
        const response = await fetch(`/api/topics/markdown-headers?topicId=${topicId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch markdown headers: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('MarkdownHeaderTree - Got markdown headers:', data);

        if (!data || !data.headers || data.headers.length === 0) {
          setError(`No headers found for ${topicId}`);
          setHeaders([]);
          return;
        }

        // Use the headers directly
        const extractedHeaders = data.headers.map((header: any) => ({
          id: header.id,
          label: header.label,
          content: ''
        }));

        console.log('MarkdownHeaderTree - Extracted headers:', extractedHeaders);
        setHeaders(extractedHeaders);

        // Fetch related categories from Supabase
        try {
          // First get the topic ID from the database
          const { data: topicData, error: topicError } = await supabase
            .from('topics')
            .select('id')
            .eq('domain', topicId)
            .single();

          if (topicError) {
            console.warn(`Error fetching topic from Supabase: ${topicError.message}`);
          } else if (topicData) {
            // Now fetch categories for this topic
            const { data: categoriesData, error: categoriesError } = await supabase
              .from('categories')
              .select('*')
              .eq('topic_id', topicData.id);

            if (categoriesError) {
              console.warn(`Error fetching categories from Supabase: ${categoriesError.message}`);
            } else if (categoriesData) {
              console.log('MarkdownHeaderTree - Got categories from Supabase:', categoriesData);
              setCategories(categoriesData);
            }
          }
        } catch (dbError) {
          console.error('Error accessing Supabase:', dbError);
        }

        setError(null);
      } catch (err) {
        console.error(`Error fetching headers for ${topicId}:`, err);
        setError(`Failed to load headers for ${topicId}`);
        setHeaders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeadersAndCategories();
  }, [topicId]);

  const handleHeaderClick = (headerId: string) => {
    console.log('MarkdownHeaderTree - handleHeaderClick:', headerId);
    setSelectedHeader(headerId);
    onSelectHeader(headerId);

    // Dispatch a custom event to hide the tree
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // Handle close button click
  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('hideTopicTree'));
  };

  // Merge headers with categories from Supabase
  const mergedHeaders = headers.map(header => {
    // Try to find a matching category in Supabase data
    const matchingCategory = categories.find(category =>
      category.name.toLowerCase() === header.label.toLowerCase() ||
      category.name.toLowerCase().includes(header.label.toLowerCase()) ||
      header.label.toLowerCase().includes(category.name.toLowerCase())
    );

    return {
      ...header,
      category: matchingCategory || null
    };
  });

  return (
    <div className={styles.treeNavContainer}>
      <button className={styles.closeButton} onClick={handleClose}>Close</button>
      <div className={styles.treeNavContent}>
        {loading ? (
          <div className="text-center p-4">
            <div className="animate-pulse">Loading headers...</div>
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">
            {error}
          </div>
        ) : mergedHeaders.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No headers found.
          </div>
        ) : (
          <div className={styles.categoriesContainer}>
            {/* Header row */}
            <div className={styles.headerRow}>
              <div className={styles.headerCell}>↓ Topic</div>
              <div className={styles.headerCell}>↓ Category</div>
            </div>

            {/* Header rows */}
            {mergedHeaders.map((header) => (
              <div
                key={header.id}
                className={`${styles.categoryRow} ${selectedHeader === header.id ? styles.selected : ''}`}
                onClick={() => handleHeaderClick(header.id)}
              >
                <div className={styles.categoryArea}>
                  <div className={styles.arrowContainer}>
                    <span>→</span>
                  </div>
                  <span className={styles.topicLabel}>{header.label}</span>
                </div>
                <div className={styles.categoryProject}>
                  <span className={styles.topicLabel}>
                    {header.category ? header.category.name : 'View Content'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownHeaderTree;
