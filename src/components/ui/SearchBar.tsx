
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

type SearchBarProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  defaultQuery?: string;
  initialValue?: string;
};

const SearchBar = ({ 
  placeholder = "Search for events, venues, users", 
  onSearch, 
  className = "",
  defaultQuery = "",
  initialValue = ""
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialValue || defaultQuery);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        // Default behavior - navigate to search page
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full min-w-0", className)}>
      <div className="flex w-full min-w-0 items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
        <Search size={20} className="shrink-0 text-muted-foreground" aria-hidden />
        <input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Search"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary p-2 text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
