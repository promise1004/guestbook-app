export const dynamic = "force-static";

export default function HeroPage() {
  const img1 =
    "https://wngtvrecglvadguqnmvd.supabase.co/storage/v1/object/public/guestbook-images/test1.png";
  const img2 =
    "https://wngtvrecglvadguqnmvd.supabase.co/storage/v1/object/public/guestbook-images/test6.png";

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Hero Slider</title>
        <style>{`
          html, body { height: 100%; margin: 0; }
          body { background:#000; overflow:hidden; }

          .hero {
            position: relative;
            width: 100%;
            height: 100vh;
            background:#000;
          }

          .slide {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0;
            transition: opacity 900ms ease;
            will-change: opacity;
          }
          .slide.isActive { opacity: 1; }

          .tint{
            position:absolute;
            inset:0;
            background: rgba(43,22,1,.70);
            pointer-events:none;
          }

          @media (max-width: 520px){
            .tint{ background: rgba(43,22,1,.55); }
          }

          @media (prefers-reduced-motion: reduce){
            .slide{ transition: none !important; }
          }
        `}</style>
      </head>

      <body>
        <section className="hero" aria-label="메인 슬라이드">
          <div
            id="s1"
            className="slide isActive"
            style={{ backgroundImage: `url("${img1}")` }}
          />
          <div
            id="s2"
            className="slide"
            style={{ backgroundImage: `url("${img2}")` }}
          />
          <div className="tint" aria-hidden="true" />
        </section>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var INTERVAL = 4500;
                var s1 = document.getElementById("s1");
                var s2 = document.getElementById("s2");
                if(!s1 || !s2) return;

                var idx = 0;

                setInterval(function(){
                  if(idx === 0){
                    s1.classList.remove("isActive");
                    s2.classList.add("isActive");
                    idx = 1;
                  } else {
                    s2.classList.remove("isActive");
                    s1.classList.add("isActive");
                    idx = 0;
                  }
                }, INTERVAL);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
