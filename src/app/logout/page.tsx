import { logoutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

export default function LogoutPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Sign out</h1>
      <p className="mt-2 text-sm text-gray-500">
        Are you sure you want to sign out of your account?
      </p>
      <form action={logoutAction} className="mt-6">
        <Button type="submit" variant="dark" size="lg" className="w-full">
          Sign Out
        </Button>
      </form>
    </div>
  );
}
