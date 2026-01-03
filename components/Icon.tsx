
import React from 'react';
import * as Lucide from 'lucide-react';

interface IconProps extends Lucide.LucideProps {
  name: string;
}

const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = (Lucide as any)[name];
  return LucideIcon ? <LucideIcon {...props} /> : null;
};

export default Icon;
