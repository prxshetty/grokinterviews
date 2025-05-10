"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const domains = [
  { id: "ml", label: "Machine Learning" },
  { id: "ai", label: "Artificial Intelligence" },
  { id: "webdev", label: "Web Development" },
  { id: "sdesign", label: "System Design" },
  { id: "dsa", label: "Data Structures & Algorithms" },
];

interface DomainNavProps {
  onDomainSelect: (domainId: string) => void;
  selectedDomain?: string | null;
}

export default function DomainNav({ onDomainSelect, selectedDomain }: DomainNavProps) {
  const [internalSelectedDomain, setInternalSelectedDomain] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Use external selected domain if provided, otherwise use internal state
  const effectiveSelectedDomain = selectedDomain !== undefined ? selectedDomain : internalSelectedDomain;

  // Sync with external state when it changes
  useEffect(() => {
    if (selectedDomain !== undefined) setInternalSelectedDomain(selectedDomain);
  }, [selectedDomain]);

  function handleDomainClick(domainId: string) {
    // If clicking the same domain that is already selected, force a complete refresh
    if (effectiveSelectedDomain === domainId) {
      window.dispatchEvent(new CustomEvent('resetCategorySelection', {
        detail: { domain: domainId }
      }));
      router.replace(`/topics/${domainId}`);
      return;
    }
    setInternalSelectedDomain(domainId);
    onDomainSelect(domainId);
    router.push(`/topics/${domainId}`);
  }

  return (
    <nav className="w-full px-4 py-4">
      <ul className="flex flex-wrap gap-3 justify-center items-center">
        {domains.map((domain) => (
          <li key={domain.id}>
            <button
              type="button"
              onClick={() => handleDomainClick(domain.id)}
              className={`px-5 py-2 text-sm md:text-base font-normal rounded-full border border-gray-200 dark:border-gray-700 transition-colors duration-200 whitespace-nowrap
                ${effectiveSelectedDomain === domain.id
                  ? "bg-black text-white dark:bg-black"
                  : "bg-white text-black dark:bg-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"}
              `}
              aria-current={effectiveSelectedDomain === domain.id ? "page" : undefined}
            >
              {domain.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
} 