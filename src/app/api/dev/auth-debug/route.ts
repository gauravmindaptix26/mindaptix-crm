import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import { UserModel } from "@/lib/models/user";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await connectDb();

    const users = await UserModel.find({}, { email: 1, role: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      ok: true,
      totalUsers: users.length,
      users: users.map((user) => ({
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    const appError = error as {
      name?: string;
      message?: string;
    };

    return NextResponse.json(
      {
        ok: false,
        error: appError.message ?? "Unknown error",
        name: appError.name ?? "UnknownError",
      },
      { status: 500 },
    );
  }
}
