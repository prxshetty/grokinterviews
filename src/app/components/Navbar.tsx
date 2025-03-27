import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-card text-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3 max-w-4xl">
        <div className="flex justify-center items-center">
          <Link href="/" className="font-bold text-2xl text-orange-500">
            Grok Interviews
          </Link>
        </div>
      </div>
    </nav>
  );
} 