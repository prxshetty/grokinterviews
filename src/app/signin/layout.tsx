import type { Metadata } from "next";
import '../globals.css';

export const metadata: Metadata = {
  title: "Sign In - Grok Interviews",
  description: "Sign in to your Grok Interviews account",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout doesn't need to add any additional elements
  // since the root layout already provides the html and body elements
  return children;
}
