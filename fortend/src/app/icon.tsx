import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d="M5.44 8.76L11.08 5.5C11.64 5.17 12.36 5.17 12.92 5.5L18.56 8.76C19.12 9.09 19.48 9.71 19.48 10.36V16.89C19.48 17.54 19.12 18.16 18.56 18.49L12.92 21.75C12.36 22.08 11.64 22.08 11.08 21.75L5.44 18.49C4.88 18.16 4.52 17.54 4.52 16.89V10.36C4.52 9.71 4.88 9.09 5.44 8.76Z"
            fill="#FFB800"
          />
          <path
            d="M12 5V22.25L18.56 18.49C19.12 18.16 19.48 17.54 19.48 16.89V10.36C19.48 9.71 19.12 9.09 18.56 8.76L12 5Z"
            fill="#0F172A"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
