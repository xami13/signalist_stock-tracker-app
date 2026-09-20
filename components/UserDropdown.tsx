'use client';
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {useRouter} from "next/navigation";
import {LogOut} from "lucide-react";
import NavItems from "@/components/NavItems";

const UserDropdown = () => {
    const router = useRouter();

    const handleSignOut: () => Promise<void> = async () => {
        router.push("/sign-in");
    }

    const user = { name: 'xami', email: 'contact@xami.com' };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "flex items-center gap-3 text-gray-4 hover:text-yellow-500"
                )}
            >

                <Avatar className={"h-8 w-8"}>
                    <AvatarImage src="https://i.pinimg.com/236x/87/bf/a2/87bfa2e8b5157adcb14fede6b5b7b7f9.jpg" />
                    <AvatarFallback className={"bg-yellow-500 text-yellow-900 text-sm font-bold"}>
                        {user.name[0]}
                    </AvatarFallback>
                </Avatar>

                <div className={"hidden md:flex flex-col items-start"}>
                    <span className={"text-base font-medium text-gray-400"}>
                        {user.name}
                    </span>
                </div>

            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className={"w-64 max-w-[calc(100vw-2rem)] text-gray-400"}>
                <DropdownMenuGroup>
                <DropdownMenuLabel>
                    <div className={"flex relative items-center gap-3 py-2"}>

                        <Avatar className={"h-10 w-10"}>
                            <AvatarImage src="https://i.pinimg.com/236x/87/bf/a2/87bfa2e8b5157adcb14fede6b5b7b7f9.jpg" />
                            <AvatarFallback className={"bg-yellow-500 text-yellow-900 text-sm font-bold"}>
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div className={"flex min-w-0 flex-col"}>
                        <span className={"text-base font-medium text-gray-400"}>
                            {user.name}
                        </span>

                            <span className={"text-sm text-gray-500 [overflow-wrap:anywhere]"}>{user.email}</span>

                        </div>

                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={"bg-gray-600"}/>

                <DropdownMenuItem onClick={handleSignOut} className={"text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"}>
                    <LogOut className={"h-4 w-5 mr-2 hidden sm:block"} />
                    Logout
                </DropdownMenuItem>

                    <DropdownMenuSeparator className={"hidden sm:block bg-gray-600"}/>

                    <nav className={"sm:hidden"}>
                        <NavItems/>
                    </nav>

                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown
