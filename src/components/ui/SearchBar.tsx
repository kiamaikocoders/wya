
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SearchBarProps = {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  defaultQuery?: string;
  initialValue?: string; // Added this property
};

const SearchBar = ({ 
  placeholder = "Search for events, venues, users", 
  onSearch, 
  className = "",
  defaultQuery = "",
  initialValue = "" // Added with default value
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
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="flex w-full items-stretch rounded-xl h-12 overflow-hidden">
        <div className="text-kenya-brown-light flex border-none bg-kenya-brown items-center justify-center pl-4 rounded-l-xl">
          <Search size={24} />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-none bg-kenya-brown focus:border-none h-full placeholder:text-kenya-brown-light px-4 py-2 text-base font-normal"
        />
        <button 
          type="submit"
          className="bg-kenya-orange text-white px-4 flex items-center justify-center"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
