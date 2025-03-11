
import React from 'react';
import { Link } from 'react-router-dom';

type CategoryItemProps = {
  name: string;
  image?: string;
  slug: string;
};

const CategoryItem = ({ name, image, slug }: CategoryItemProps) => {
  return (
    <Link to={`/categories/${slug}`} className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-60 transition-transform hover:scale-[1.03] animate-fade-in">
      <div
        className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex flex-col"
        style={{ backgroundImage: image ? `url(${image})` : undefined }}
      />
      <p className="text-white text-base font-medium leading-normal">{name}</p>
    </Link>
  );
};

export default CategoryItem;
