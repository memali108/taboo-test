import Image from "next/image";
import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center no-underline">
      <Image src="/logo.png" alt="The Taboo Trilogy" width={48} height={48} priority className="size-10 md:size-12" />
    </Link>
  );
}
