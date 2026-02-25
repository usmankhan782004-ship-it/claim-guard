// ─── Upload Bill API Route ───────────────────────────────────
// POST /api/upload-bill
// Receives multipart/form-data with a bill file,
// uploads it to Supabase Storage, and creates a bills record.
// ──────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Verify authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided. Please upload a bill image or PDF." },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/tiff",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                {
                    error: `Invalid file type: ${file.type}. Accepted: PDF, JPEG, PNG, WebP, TIFF.`,
                },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            );
        }

        // Generate unique file path: {userId}/{timestamp}_{filename}
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

        // Upload to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from("bills")
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return NextResponse.json(
                { error: `Failed to upload file: ${uploadError.message}` },
                { status: 500 }
            );
        }

        // Get public URL for the uploaded file
        const {
            data: { publicUrl },
        } = supabase.storage.from("bills").getPublicUrl(filePath);

        // Create bill record in database
        const { data: bill, error: insertError } = await supabase
            .from("bills")
            .insert({
                user_id: user.id,
                file_name: file.name,
                file_path: filePath,
                file_url: publicUrl,
                file_type: file.type,
                status: "uploaded",
            })
            .select()
            .single();

        if (insertError) {
            // Clean up uploaded file if DB insert fails
            await supabase.storage.from("bills").remove([filePath]);
            console.error("DB insert error:", insertError);
            return NextResponse.json(
                { error: `Failed to create bill record: ${insertError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                bill: {
                    id: bill.id,
                    fileName: bill.file_name,
                    fileUrl: bill.file_url,
                    status: bill.status,
                    createdAt: bill.created_at,
                },
                message: "Bill uploaded successfully. Ready for analysis.",
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Upload bill error:", err);
        return NextResponse.json(
            {
                error:
                    err instanceof Error ? err.message : "An unexpected error occurred.",
            },
            { status: 500 }
        );
    }
}
