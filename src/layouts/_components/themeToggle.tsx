import { Moon, Sun } from 'lucide-react';



import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme-provider';


export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const handleThemeChange = () => {
    // Add class to temporarily disable transitions
    document.documentElement.classList.add('disable-transitions');

    // Toggle the theme (e.g., tailwind `dark` class or your own logic)
    document.documentElement.classList.toggle('dark');

    // Wait for the next repaint and then remove the class
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.documentElement.classList.remove('disable-transitions');
      }, 0);
    });

    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button variant="ghost" className={''} size="icon" onClick={handleThemeChange}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
