
import React from 'react';
import { Link } from 'react-router-dom';

type CategoryItemProps = {
  name: string;
  image?: string;
  slug?: string;
  icon?: string;
  isActive?: boolean;
  onClick?: () => void;
};

const CategoryItem = ({ name, image, slug, icon, isActive, onClick }: CategoryItemProps) => {
  const baseClassName = `flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60 transition-transform hover:scale-[1.03] animate-fade-in ${isActive ? 'bg-kenya-orange/20 p-3' : ''}`;
  
  // Separate rendering based on component type
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        type="button"
        className={baseClassName}
      >
        <div
          className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col items-center justify-center"
          style={{ backgroundImage: image ? `url(${image})` : undefined }}
        >
          {icon && <span className="text-4xl">{icon}</span>}
        </div>
        <p className="text-white text-base font-medium leading-normal">{name}</p>
      </button>
    );
  } else if (slug) {
    return (
      <Link 
        to={`/categories/${slug}`}
        className={baseClassName}
      >
        <div
          className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col items-center justify-center"
          style={{ backgroundImage: image ? `url(${image})` : undefined }}
        >
          {icon && <span className="text-4xl">{icon}</span>}
        </div>
        <p className="text-white text-base font-medium leading-normal">{name}</p>
      </Link>
    );
  } else {
    return (
      <div className={baseClassName}>
        <div
          className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col items-center justify-center"
          style={{ backgroundImage: image ? `url(${image})` : undefined }}
        >
          {icon && <span className="text-4xl">{icon}</span>}
        </div>
        <p className="text-white text-base font-medium leading-normal">{name}</p>
      </div>
    );
  }
};

export default CategoryItem;
