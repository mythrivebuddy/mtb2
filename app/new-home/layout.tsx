import Footer from "./_components/Footer";
import Navbar from "./_components/Navbar";

export const metadata = {
  title: "My Thrive Buddy – Home",
  description: "Homepage custom layout",
};

export default function HomePageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Load Manrope font ONLY for this layout */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Force Tailwind to use Manrope locally */}
      <style>
        {`
          .home-page-font {
            font-family: 'Manrope', sans-serif !important;
          }
        `}
      </style>

      <div className="min-h-screen min-w-screen home-page-font">
          <div className="min-w-screen font-display bg-background-light text-slate-800 dark:text-slate-200">
                
              <Navbar/>
        {children}
         <Footer/>
        </div>
      </div>
    </>
  );
}
