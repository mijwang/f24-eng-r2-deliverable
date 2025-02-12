"use client";
/*
Note: "use client" is a Next.js App Router directive that tells React to render the component as
a client component rather than a server component. This establishes the server-client boundary,
providing access to client-side functionality such as hooks and event handlers to this component and
any of its imported children. Although the SpeciesCard component itself does not use any client-side
functionality, it is beneficial to move it to the client because it is rendered in a list with a unique
key prop in species/page.tsx. When multiple component instances are rendered from a list, React uses the unique key prop
on the client-side to correctly match component state and props should the order of the list ever change.
React server components don't track state between rerenders, so leaving the uniquely identified components (e.g. SpeciesCard)
can cause errors with matching props and state in child components if the list order changes.
*/
// import { Button } from "@/components/ui/button";
// import type { Database } from "@/lib/schema";
// import Image from "next/image";
// type Species = Database["public"]["Tables"]["species"]["Row"];

// export default function SpeciesCard({ species }: { species: Species }) {
//   return (
//     <div className="m-4 w-72 min-w-72 flex-none rounded border-2 p-3 shadow">
//       {species.image && (
//         <div className="relative h-40 w-full">
//           <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
//         </div>
//       )}
//       <h3 className="mt-3 text-2xl font-semibold">{species.scientific_name}</h3>
//       <h4 className="text-lg font-light italic">{species.common_name}</h4>
//       <p>{species.description ? species.description.slice(0, 150).trim() + "..." : ""}</p>
//       {/* Replace the button with the detailed view dialog. */}
//       <Button className="mt-3 w-full">Learn More</Button>
//     </div>
//   );
// }
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const speciesSchema = z.object({
  scientific_name: z.string().min(1, { message: "Scientific name is required." }),
  common_name: z.string().nullable(),
  description: z.string().nullable(),
  kingdom: z.string().nullable(),
  total_population: z.number().nullable(),
  image: z.string().url().nullable(),
  endangered: z.boolean().default(false),
});

type Species = Database["public"]["Tables"]["species"]["Row"];

interface SpeciesCardProps {
  species: Species;
  sessionId: string;
}

export default function SpeciesCard({ species, sessionId }: SpeciesCardProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const router = useRouter();

  const defaultValues = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    description: species.description,
    kingdom: species.kingdom,
    total_population: species.total_population,
    image: species.image,
    author: species.author,
    endangered: species.endangered,
  };

  const form = useForm({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: typeof defaultValues) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").update(data).eq("id", species.id);

    if (error) {
      toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setIsEditing(false);
    form.reset(data);
    router.refresh();

    toast({
      title: "Species updated successfully!",
    });
  };

  const handleDelete = async () => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").delete().eq("id", species.id);

    if (error) {
      toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(false);
    router.refresh();

    toast({
      title: "Species deleted successfully!",
    });
  };

  return (
    <div className="m-4 w-72 min-w-72 flex-none rounded border-2 p-3 shadow">
      {species.image && (
        <div className="relative h-40 w-full">
          <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
        </div>
      )}
      <h3 className="mt-3 text-2xl font-semibold">{species.scientific_name}</h3>
      <h4 className="text-lg font-light italic">{species.common_name}</h4>
      <p>{species.description ? species.description.slice(0, 150).trim() + "..." : ""}</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-3 w-full">Learn More</Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{species.scientific_name}</DialogTitle>
            <DialogDescription>{species.common_name}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {species.image && (
              <div className="relative mb-4 h-40 w-full">
                <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
              </div>
            )}
            <p>
              <strong>Total Population:</strong> {species.total_population}
            </p>
            <p>
              <strong>Kingdom:</strong> {species.kingdom}
            </p>
            <p>
              {" "}
              <strong>Endangered:</strong> {species.endangered ? "Yes" : "No"}{" "}
            </p>
            <p className="mt-2">{species.description}</p>
          </div>
          {species.author == sessionId && (
            <div className="mt-4 space-y-2">
              <Button className="w-full" onClick={() => setIsEditing(true)}>
                Edit Species
              </Button>
              <Button className="w-full" variant="destructive" onClick={() => setIsDeleting(true)}>
                Delete Species
              </Button>
            </div>
          )}
          <DialogClose asChild>
            <Button className="mt-4 w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {isEditing && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Species</DialogTitle>
              <DialogDescription>Edit the details of your species below.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="scientific_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scientific Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="common_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Common Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kingdom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kingdom</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_population"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Population</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endangered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endangered Status</FormLabel>
                      <FormControl>
                        <Input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="flex-1">
                      Cancel
                    </Button>
                  </DialogClose>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {isDeleting && (
        <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{species.scientific_name}</strong>? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex space-x-2">
              <Button variant="destructive" className="flex-1" onClick={() => void handleDelete()}>
                Confirm Delete
              </Button>
              <DialogClose asChild>
                <Button variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
