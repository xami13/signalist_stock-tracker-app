'use client';
import { cn } from "@/lib/utils";
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
import {signOut} from "@/lib/actions/auth.actions";
import NavItems from "@/components/NavItems";


const UserDropdown = ({ user, initialStocks }: {user: User, initialStocks: StockWithWatchlistStatus[ ]}) => {
    const router = useRouter();

    const handleSignOut: () => Promise<void> = async () => {
        await signOut();
        router.push("/sign-in");
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "flex items-center gap-3 text-gray-400 hover:text-yellow-500"
                )}
            >

                <Avatar className={"h-8 w-8"}>
                    <AvatarImage src="https://i.pinimg.com/236x/87/bf/a2/87bfa2e8b5157adcb14fede6b5b7b7f9.jpg" />
                    <AvatarFallback className={"bg-yellow-500 text-yellow-900 text-sm font-bold"}>
                        {user.name?.[0] ?? user.email?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                </Avatar>

                <div className={"hidden md:flex flex-col items-start"}>
                    <span className={"text-base font-medium text-gray-400"}>
                        {user.name}
                    </span>
                </div>

            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className={"w-72 max-w-[calc(100vw-2rem)] text-gray-400"}>
                <DropdownMenuGroup>
                <DropdownMenuLabel>
                    <div className={"flex relative items-center gap-3 py-2"}>

                        <Avatar className={"h-10 w-10"}>
                            <AvatarImage src="https://i.pinimg.com/236x/87/bf/a2/87bfa2e8b5157adcb14fede6b5b7b7f9.jpg" />
                            <AvatarFallback className={"bg-yellow-500 text-yellow-900 text-sm font-bold"}>
                                {user.name?.[0] ?? user.email?.[0]?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                        </Avatar>

                        <div className={"flex min-w-0 flex-col"}>
                        <span className={"text-base font-medium text-gray-400"}>
                            {user.name}
                        </span>

                            <span className={"truncate whitespace-nowrap text-sm text-gray-500"}>{user.email}</span>

                        </div>

                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className={"bg-gray-600"}/>

                <DropdownMenuItem onClick={handleSignOut} className={"text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"}>
                    <LogOut className={"mr-2 h-4 w-5"} />
                    Logout
                </DropdownMenuItem>

                    <nav className={"sm:hidden"}>
                        <NavItems initialStocks={initialStocks}/>
                    </nav>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default UserDropdown

