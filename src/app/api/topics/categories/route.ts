import { NextRequest, NextResponse } from 'next/server';
import { GET as dbGet } from './db-route';

// Define type for category items
type CategoryItem = {
  id: string;
  label: string;
};

export async function GET(request: NextRequest) {
  // Forward all requests to the database route
  return dbGet(request);
}
