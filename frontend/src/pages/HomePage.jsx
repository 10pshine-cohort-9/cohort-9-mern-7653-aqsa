import React from "react";

export default function HomePage() {
  return (
    <div className="font-raleway min-h-screen bg-[#fdf9f1] text-[#1c1c17] antialiased selection:bg-[#0040df] selection:text-white">
      <nav className="border-b border-[#e6e2db] bg-[#fdf9f1]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0040df] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl leading-none tracking-tighter">
                  N
                </span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                Notes App
              </span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="/auth"
                className="text-sm font-semibold text-[#5f5e5d] hover:text-[#1c1c17] transition-colors"
              >
                Sign In
              </a>

              <a
                href="/auth"
                className="bg-[#0040df] hover:bg-[#0035bd] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
            Finally, a workspace that thinks{" "}
            <span className="text-[#0040df]">like you do.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#5f5e5d] mb-10 max-w-2xl mx-auto leading-relaxed">
            Type, draw, record, and organize. Bring your multi-media notes,
            tasks, and quick thoughts into one seamlessly unified workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="/auth"
              className="w-full sm:w-auto bg-[#0040df] text-white font-medium px-8 py-4 rounded-xl hover:bg-[#0035bd] transition-colors shadow-[0_4px_14px_rgba(0,64,223,0.3)] text-lg flex items-center justify-center gap-2"
            >
              Start Noting for Free

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
          <div className="max-w-5xl mx-auto bg-white p-2 rounded-[2rem] border border-[#e6e2db] shadow-[0_20px_60px_rgba(0,0,0,0.08)] relative overflow-hidden">
            <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl bg-gradient-to-br from-[#1c1c17] via-[#2a2923] to-[#0040df] p-8 flex flex-col relative overflow-hidden shadow-inner text-left">
              <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-[#0040df]/30 blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-[#fdf9f1]/10 blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex gap-6 h-full">
                <div className="hidden md:flex flex-col w-48 gap-3 border-r border-white/10 pr-6">
                  <div className="h-6 w-24 bg-white/20 rounded-md mb-4" />
                  <div className="h-4 w-full bg-white/10 rounded-md" />
                  <div className="h-4 w-3/4 bg-white/10 rounded-md" />
                  <div className="h-4 w-5/6 bg-white/10 rounded-md" />
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <div className="h-8 w-1/3 bg-white/20 rounded-lg mb-2" />

                  <div className="flex gap-4">
                    <div className="h-24 w-48 bg-white/10 rounded-xl border border-white/5 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white/50 text-sm font-medium">
                        Audio Note Playing...
                      </span>
                    </div>

                    <div className="h-24 w-32 bg-white/10 rounded-xl border border-white/5 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white/50 text-sm font-medium">
                        Handwritten
                      </span>
                    </div>
                  </div>

                  <div className="h-4 w-full bg-white/10 rounded-md mt-4" />
                  <div className="h-4 w-5/6 bg-white/10 rounded-md" />
                  <div className="h-4 w-4/6 bg-white/10 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-white border-t border-[#e6e2db]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to capture ideas.
            </h2>

            <p className="text-[#5f5e5d] text-lg">
              Write, draw, record, organize, and share — all from one
              multi-media workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-none p-8 border border-[#e6e2db] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] min-h-[340px] flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
                <svg width="100%" height="100%">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 28}
                      x2="100%"
                      y2={i * 28}
                      stroke="#1c1c17"
                      strokeWidth="0.5"
                    />
                  ))}
                </svg>
              </div>
              <div className="relative z-10">
                <div className="text-xs font-bold text-[#0040df] tracking-[0.1em] uppercase mb-4">
                  Draw
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">
                  A canvas, not
                  <br />
                  a text box.
                </h3>
                <p className="text-[#5f5e5d] text-sm leading-relaxed">
                  Draw, annotate, and sketch directly on your notes pages.
                  Each page is a blank canvas — mix freehand strokes with text
                  and media.
                </p>
              </div>
              <div className="mt-auto pt-8">
                <svg width="100%" height="70" viewBox="0 0 260 70">
                  <path
                    d="M4,50 C30,20 50,60 80,35 C110,8 130,54 160,30 C190,6 210,45 256,22"
                    stroke="#0040df"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4,60 C40,56 80,64 120,58 C160,52 200,62 256,55"
                    stroke="#e6e2db"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <circle cx="80" cy="35" r="3" fill="#0040df" />
                  <circle cx="160" cy="30" r="3" fill="#0040df" />
                </svg>
              </div>
            </div>
            <div className="bg-[#1c1c17] rounded-none p-8 border border-[#2d2d26] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] min-h-[340px] flex flex-col">
              <div className="text-xs font-bold text-[#0040df] tracking-[0.1em] uppercase mb-4">
                Audio Notes
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-[#fdf9f1] mb-3">
                Capture ideas
                <br />
                by voice.
              </h3>
              <p className="text-[#8a8a80] text-sm leading-relaxed">
                Record audio directly inside a note. Playback, scrub, and
                organize recordings alongside your written content.
              </p>
              <div className="mt-auto pt-8">
                <div className="bg-[#2a2923] p-4 border border-[#3a3930]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0040df] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">▶</span>
                    </div>
                    <div className="flex-1 flex items-end gap-[3px] h-8">
                      {[3, 6, 4, 9, 7, 5, 8, 6, 10, 7, 5, 9, 6, 4, 7, 5, 8, 6, 9, 4].map(
                        (h, i) => (
                          <div
                            key={i}
                            className={`flex-1 ${
                              i < 11 ? "bg-[#0040df]" : "bg-[#3a3930]"
                            }`}
                            style={{ height: `${h * 2.6}px` }}
                          />
                        )
                      )}
                    </div>

                    <span className="text-[11px] text-[#666] flex-shrink-0">
                      0:47 / 2:13
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f7f3eb] rounded-none p-8 border border-[#e6e2db] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] min-h-[340px] flex flex-col">
              <div className="text-xs font-bold text-[#0040df] tracking-[0.1em] uppercase mb-4">
                Organize
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-3">
                Folders, categories,
                <br />
                favorites — your system.
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  { name: "Work", count: 12, color: "#0040df" },
                  { name: "Research", count: 8, color: "#1c1c17" },
                  { name: "Personal", count: 5, color: "#5f5e5d" },
                ].map((folder) => (
                  <div
                    key={folder.name}
                    className="flex items-center justify-between border-b border-[#e6e2db] pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-5"
                        style={{ background: folder.color }}
                      />

                      <span className="text-sm font-bold">
                        {folder.name}
                      </span>
                    </div>

                    <span className="text-xs text-[#5f5e5d]">
                      {folder.count} notes
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-5 flex flex-wrap gap-2">
                {["Design", "Strategy", "Q4", "Archive"].map((category) => (
                  <span
                    key={category}
                    className="text-xs font-semibold px-3 py-1.5 border border-[#e6e2db] bg-white"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-none p-8 border border-[#e6e2db] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] min-h-[320px] flex flex-col">
              <div className="text-xs font-bold text-[#0040df] tracking-[0.1em] uppercase mb-4">
                Video Notes
              </div>

              <h3 className="text-2xl font-bold tracking-tight mb-3">
                Embed video.
                <br />
                Keep context.
              </h3>

              <p className="text-[#5f5e5d] text-sm leading-relaxed">
                Upload video clips directly into a note page. Watch, review,
                and annotate without ever leaving your workspace.
              </p>

              <div className="mt-auto pt-6">
                <div className="h-28 bg-[#1c1c17] relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2a2923] to-[#1c1c17]" />

                  <div className="w-10 h-10 border-2 border-white/40 rounded-full flex items-center justify-center relative z-10">
                    <span className="text-white/70 text-sm pl-1">▶</span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2a2923]">
                    <div className="w-[42%] h-full bg-[#0040df]" />
                  </div>

                  <div className="absolute bottom-2 right-2 text-[10px] text-white/50">
                    0:18 / 0:43
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f7f3eb] rounded-none p-8 border border-[#e6e2db] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] min-h-[320px] flex flex-col">
              <div className="text-xs font-bold text-[#0040df] tracking-[0.1em] uppercase mb-4">
                Image Notes
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-3">
                Visual thinking,
                <br />
                on the page.
              </h3>

              <p className="text-[#5f5e5d] text-sm leading-relaxed">
                Drop images anywhere on a note page. Resize, reposition, and
                annotate them alongside your text.
              </p>

              <div className="mt-auto pt-6 grid grid-cols-2 grid-rows-2 gap-1 h-28">
                <div className="bg-[#e6e2db] row-span-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#dedad3_0px,#dedad3_2px,#e6e2db_2px,#e6e2db_14px)]" />
                  <div className="absolute bottom-2 left-2 w-3/5 h-[2px] bg-[#c8c3bb]" />
                </div>

                <div className="bg-[#e0dbd4] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#d6d1ca_0px,#d6d1ca_2px,#e0dbd4_2px,#e0dbd4_10px)]" />
                </div>

                <div className="bg-[#ccc7bf] relative overflow-hidden">
                  <div className="absolute bottom-1 right-1 w-2 h-2 border border-[#b8b3ab] rounded-full" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-none p-8 border border-[#e6e2db] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] min-h-[320px] flex flex-col">
              <div className="text-xs font-bold text-[#0040df] tracking-[0.1em] uppercase mb-4">
                Export
              </div>

              <h3 className="text-2xl font-bold tracking-tight mb-3">
                Share what
                <br />
                you've built.
              </h3>

              <p className="text-[#5f5e5d] text-sm leading-relaxed">
                Export any note as a pixel-perfect PDF. Every page, image,
                drawing, and layout preserved exactly as you designed it.
              </p>

              <div className="mt-auto pt-6 flex justify-center items-end h-32 relative">
                <div className="absolute bottom-2 w-28 h-20 bg-[#f7f3eb] border border-[#e6e2db] rotate-[-5deg]" />

                <div className="absolute bottom-1 w-28 h-20 bg-[#f7f3eb] border border-[#e6e2db] rotate-[3deg]" />

                <div className="absolute bottom-0 w-28 h-20 bg-white border border-[#e6e2db] p-2 z-10">
                  <div className="h-1.5 bg-[#e6e2db] mb-1 w-[70%]" />
                  <div className="h-1 bg-[#f0ede7] mb-1 w-[90%]" />
                  <div className="h-1 bg-[#f0ede7] mb-1 w-[80%]" />

                  <div className="absolute bottom-2 right-2 text-[10px] font-bold text-[#0040df]">
                    PDF
                  </div>
                </div>
              </div>
            </div>

          </div>
          <div className="mt-4 bg-gradient-to-br from-[#1c1c17] to-[#0040df] rounded-none p-10 md:p-14 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full" />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <div className="text-xs font-bold text-[#6699ff] tracking-[0.1em] uppercase mb-4">
                Get started
              </div>

              <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Ready to build your workspace?
              </h3>

              <p className="text-white/75 text-base leading-relaxed mb-8">
                Everything is free to start. Create your first note and see
                what a real multi-media workspace feels like.
              </p>

              <a
                href="/auth"
                className="inline-flex items-center gap-2 bg-white text-[#1c1c17] font-semibold px-7 py-3.5 hover:bg-[#fdf9f1] transition-colors rounded-lg"
              >
                Create Free Account

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M2 7h10M8 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-[#e6e2db] py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0040df] flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>

            <span className="text-sm font-bold">Notes App</span>
          </div>

          <span className="text-xs text-[#5f5e5d]">
            A multi-media workspace for your thinking.
          </span>
        </div>
      </footer>
    </div>
  );
}