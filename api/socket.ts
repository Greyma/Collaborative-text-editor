// Socket.IO server endpoint - note: this would typically run on a separate server
// For now, this is a stub for production deployment
export const config = {
  runtime: "nodejs",
}

export default function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Socket.IO server should run separately" }),
  }
}
