'use client';

export default function TawkToWidget() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API = Tawk_API || {};
            var Tawk_LoadStart = new Date();
            (function() {
              var s1 = document.createElement('script');
              s1.async = true;
              s1.src = 'https://embed.tawk.to/fa6a6f3791e02a9bbe2bee7e3ed0a5258643dbae';
              s1.charset = 'UTF-8';
              s1.setAttribute('crossorigin', '*');
              var s0 = document.getElementsByTagName('script')[0];
              s0.parentNode.insertBefore(s1, s0);
            })();
          `,
        }}
      />
    </>
  );
}
