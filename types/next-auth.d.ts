import "next-auth"

declare module "next-auth" {
  interface User {
    establishmentId: string
    establishmentSlug: string
  }
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      establishmentId: string
      establishmentSlug: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    establishmentId: string
    establishmentSlug: string
  }
}
