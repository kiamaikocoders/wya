
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
      <div className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur focus-within:border-kenya-orange/60">
        <div className="flex items-center justify-center rounded-full bg-white/5 p-2 text-white/60">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
        />
        <button 
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kenya-orange via-amber-400 to-kenya-orange px-4 py-2 text-sm font-semibold text-kenya-dark shadow-[0_0_20px_rgba(255,128,0,0.35)] hover:shadow-[0_0_28px_rgba(255,128,0,0.45)]"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
