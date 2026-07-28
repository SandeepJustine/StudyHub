export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-grey-light">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("/images/patterns/pencils.svg")', backgroundRepeat: 'repeat', backgroundSize: '80px 80px' }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("/images/patterns/education-icons.svg")', backgroundRepeat: 'repeat', backgroundSize: '120px 120px' }} />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-navy/[0.04] blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-red/[0.04] blur-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
