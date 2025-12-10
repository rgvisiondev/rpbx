// app/not-found.tsx
import NavGate from "./components/NavGate";
import Button from "./components/Button";

export default function NotFound() {

  return (
    <div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
          <NavGate />
        </div>

        <div className="flex flex-col items-center justify-center w-full flex-1 px-5 lg:px-2 py-20">
          {/* 404 Number Display */}
          <div className="relative mb-5 text-center">
            <h3 className="giant">
              404
            </h3>
          </div>

          {/* Content */}
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Page Not Found
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
              We could not find the page you are looking for. It might have been moved, deleted, or perhaps it never existed.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/" variant="primary">
                Back To Home
              </Button>
              <Button href="mailto:info@rioplexbizx.com" variant="primary">
                Contact RPBX
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}