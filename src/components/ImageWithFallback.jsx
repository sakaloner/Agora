'use client'

export default function ImageWithFallback({ src, alt, style, ...props }) {
  const handleError = (e) => {
    if (e.target.src !== '/default-avatar.jpg') {
      e.target.src = '/default-avatar.jpg'
    }
  }

  return (
    <img 
      src={src || '/default-avatar.jpg'} 
      alt={alt} 
      style={style} 
      onError={handleError}
      {...props}
    />
  )
}