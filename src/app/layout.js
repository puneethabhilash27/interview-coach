import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Background from "@/components/Background";

export const metadata = {
  title: "InterviewCoach AI | Master Your Interviews",
  description: "AI-powered interview practice with real-time feedback and evaluation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Background />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
