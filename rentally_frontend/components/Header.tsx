import { Search } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-card border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">Дабан</h1>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground">
            <a href="#" className="hover:text-primary transition-colors">Газрын зураг</a>
            <a href="#" className="hover:text-primary transition-colors">Шинэ барилга</a>
            <a href="#" className="hover:text-primary transition-colors">Хадгалсан</a>
            <a href="#" className="relative hover:text-primary transition-colors">
              Миний гэр
              <span className="absolute -top-2 -right-6 text-[10px] px-1.5 py-0.5 rounded bg-dabang-orange text-primary-foreground font-bold">
                Шинэ
              </span>
            </a>
          </nav>

          {/* Auth links */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <button className="text-muted-foreground hover:text-foreground transition-colors">Нэвтрэх</button>
            <span className="text-border">|</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors">Бүртгүүлэх</button>
            <span className="text-border">|</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors">Зуучлагч бүртгэл</button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="max-w-screen-xl mx-auto px-4 pb-4">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Дүүрэг, метро, их сургууль эсвэл байрны нэрээр хайх..."
            className="w-full h-12 pl-12 pr-4 rounded-full bg-secondary text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 border"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
