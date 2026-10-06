import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "app.newconvertfollowup.twa",
          sha256_cert_fingerprints: [
            "5B:1A:FA:D4:B4:34:3C:46:20:89:56:B4:B7:91:61:7E:E2:FF:90:90:21:BC:66:AB:7A:4F:44:43:1B:85:2F:62",
          ],
        },
      },
    ],
    { headers: { "Content-Type": "application/json" } },
  );
}
