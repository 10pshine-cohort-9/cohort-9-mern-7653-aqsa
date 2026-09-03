import { useState, useEffect } from "react";
import api from "../../api/axios";
export default function Header() {
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("Good day");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    api.get("/auth/profile")
      .then((res) => {
        if (res.data?.success && res.data?.user?.username) {
          setUserName(res.data.user.username);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile name:", err);
      });
  }, []);
  return (
    <header className="mb-12">
      <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#1c1c17] mb-2">
        {greeting}{userName ? `, ${userName}` : ""}!
      </h2>
      <p className="text-lg leading-relaxed text-[#5f5e5d] max-w-xl">
        Capture an idea. Finish something. Keep moving.
      </p>
    </header>
  );
}