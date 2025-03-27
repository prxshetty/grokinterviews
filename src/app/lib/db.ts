import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Singleton pattern for database connection
let db: Database | null = null;

export async function getDbConnection() {
  if (db) {
    return db;
  }
  
  // Open database connection
  db = await open({
    filename: path.join(process.cwd(), 'interview_prep.db'),
    driver: sqlite3.Database
  });
  
  return db;
}

// Function to get all topics
export async function getTopics() {
  const db = await getDbConnection();
  return db.all('SELECT topic_id, name FROM topics ORDER BY display_order');
}

// Function to get questions by topic
export async function getQuestionsByTopic(topicId: number) {
  const db = await getDbConnection();
  return db.all(
    'SELECT question_id, title FROM questions WHERE topic_id = ? ORDER BY display_order',
    topicId
  );
}

// Function to get content for a specific question
export async function getContentByQuestion(questionId: number) {
  const db = await getDbConnection();
  return db.all(
    'SELECT content_id, content_type, content, media_url, caption, subtype FROM content WHERE question_id = ? ORDER BY display_order',
    questionId
  );
}

// Function to get videos for a specific question
export async function getVideosByQuestion(questionId: number) {
  const db = await getDbConnection();
  return db.all(
    'SELECT video_id, youtube_url, youtube_video_id, title, caption, display_order, source_type FROM videos WHERE question_id = ? ORDER BY display_order',
    questionId
  );
}

// Function to get combined content and videos for a question
export async function getAllContentByQuestion(questionId: number) {
  const content = await getContentByQuestion(questionId);
  const videos = await getVideosByQuestion(questionId);
  
  // Format videos to be compatible with content display
  const formattedVideos = videos.map(video => ({
    content_id: `video_${video.video_id}`, // Create a unique ID
    content_type: 'video',
    content: null,
    media_url: video.youtube_url,
    youtube_video_id: video.youtube_video_id,
    caption: video.title || video.caption,
    subtype: video.source_type,
    display_order: video.display_order
  }));
  
  // Combine content and videos, then sort by display_order
  return [...content, ...formattedVideos].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );
} 