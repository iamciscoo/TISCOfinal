 
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import EditUser from "@/components/EditUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLineChart from "@/components/AppLineChart";
import { getUserById, getUserMonthlyOrderActivity } from "@/lib/database";

const SingleUserPage = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const user = await getUserById(id).catch(() => null);
  const activity = user ? await getUserMonthlyOrderActivity(id, 6).catch(() => []) : [];
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "User";

  // Address fallbacks: prefer user columns, then default shipping address if present
  const addressLine1 = (user && (user as { address_line_1?: string; default_shipping_address?: { address_line_1?: string } }).address_line_1) ||
    (user && (user as { default_shipping_address?: { address_line_1?: string } }).default_shipping_address?.address_line_1) || "";
  const city = (user && (user as { city?: string; default_shipping_address?: { city?: string } }).city) ||
    (user && (user as { default_shipping_address?: { city?: string } }).default_shipping_address?.city) || "";

  // Compute profile completion based on selected fields
  const profileFields = [
    user?.email,
    user?.phone,
    addressLine1,
    city,
    user?.avatar_url,
    user?.first_name,
    user?.last_name,
  ];
  const filled = profileFields.filter((v) => (typeof v === 'string' ? v.trim().length > 0 : Boolean(v))).length;
  const progress = Math.round((filled / profileFields.length) * 100);
  return (
    <div className="">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/users">Users</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* CONTAINER */}
      <div className="mt-4 flex flex-col xl:flex-row gap-8">
        {/* LEFT */}
        <div className="w-full xl:w-1/3 space-y-6">
          {/* USER BADGES REMOVED */}
          {/* USER CARD CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="size-12">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback>
                  {(fullName || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-semibold">{fullName}</h1>
            </div>
          </div>
          {/* INFORMATION CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">User Information</h1>
              <Sheet>
                <SheetTrigger asChild>
                  <Button>Edit User</Button>
                </SheetTrigger>
                {user && (
                  <EditUser
                    userId={String(user.id)}
                    defaultValues={{
                      fullName,
                      email: user.email,
                      phone: user.phone ?? "",
                      address: addressLine1,
                      city: city,
                    }}
                  />
                )}
              </Sheet>
            </div>
            <div className="space-y-4 mt-4">
              <div className="flex flex-col gap-2 mb-8">
                <p className="text-sm text-muted-foreground">Profile completion</p>
                <Progress value={progress} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Full name:</span>
                <span>{fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Email:</span>
                <span>{user?.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Phone:</span>
                <span>{user?.phone || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Address:</span>
                <span>{addressLine1 || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">City:</span>
                <span>{city || '-'}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Joined on {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
            </p>
          </div>
        </div>
        {/* RIGHT */}
        <div className="w-full xl:w-2/3 space-y-6">
          
          {/* CHART CONTAINER */}
          <div className="bg-primary-foreground p-4 rounded-lg">
            <h1 className="text-xl font-semibold">User Activity</h1>
            <AppLineChart data={activity} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleUserPage;
