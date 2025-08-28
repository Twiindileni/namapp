import { supabase } from '@/lib/supabase'

export async function uploadToBucket(bucket: string, path: string, file: File, contentType?: string) {
	const { error } = await supabase.storage.from(bucket).upload(path, file, {
		contentType,
		upsert: true
	})
	if (error) throw error
}

export function getPublicUrl(bucket: string, path: string): string {
	const { data } = supabase.storage.from(bucket).getPublicUrl(path)
	return data.publicUrl
}

export async function removeFromBucket(bucket: string, path: string) {
	const { error } = await supabase.storage.from(bucket).remove([path])
	if (error) throw error
}