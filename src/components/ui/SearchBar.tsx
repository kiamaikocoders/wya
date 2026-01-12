
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
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="flex w-full items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
        <div className="flex items-center justify-center rounded-full bg-muted p-2 text-muted-foreground">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button 
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all transform hover:scale-105"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
