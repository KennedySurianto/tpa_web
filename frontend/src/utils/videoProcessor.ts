import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

/**
 * Initialize FFmpeg instance
 */
const initializeFFmpeg = async (): Promise<FFmpeg> => {
    if (ffmpeg && ffmpeg.loaded) {
        return ffmpeg;
    }

    ffmpeg = new FFmpeg();
    
    // Load FFmpeg with CDN URLs (you might need to host these files yourself for production)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';
    
    ffmpeg.on('log', ({ message }) => {
        console.log(message);
    });

    // Load FFmpeg core
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
};

/**
 * Compress a video file using ffmpeg.wasm
 * @param file - The video file to compress
 * @param options - Compression options
 * @returns Compressed video as Uint8Array
 */
export const compressVideo = async (
    file: File, 
    options: {
        crf?: number; // Quality factor (18-28 recommended, lower = better quality)
        maxWidth?: number; // Maximum width for resizing
        maxHeight?: number; // Maximum height for resizing
        format?: 'mp4' | 'webm'; // Output format
    } = {}
): Promise<Uint8Array> => {
    const { crf = 28, maxWidth, maxHeight, format = 'mp4' } = options;
    
    const ffmpegInstance = await initializeFFmpeg();
    
    // Write input file
    const inputFileName = `input.${file.name.split('.').pop() || 'mp4'}`;
    const outputFileName = `output.${format}`;
    
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));

    // Build ffmpeg command
    const ffmpegArgs = ['-i', inputFileName];
    
    // Video codec
    if (format === 'mp4') {
        ffmpegArgs.push('-vcodec', 'libx264');
    } else if (format === 'webm') {
        ffmpegArgs.push('-vcodec', 'libvpx-vp9');
    }
    
    // Quality setting
    ffmpegArgs.push('-crf', crf.toString());
    
    // Resize if specified
    if (maxWidth || maxHeight) {
        const scaleFilter = maxWidth && maxHeight 
            ? `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`
            : maxWidth 
                ? `scale='min(${maxWidth},iw)':-2`
                : `scale=-2:'min(${maxHeight},ih)'`;
        ffmpegArgs.push('-vf', scaleFilter);
    }
    
    // Audio codec
    ffmpegArgs.push('-acodec', 'aac', '-ab', '128k');
    
    // Output file
    ffmpegArgs.push(outputFileName);
    
    // Run ffmpeg
    await ffmpegInstance.exec(ffmpegArgs);

    // Read output file
    const data = await ffmpegInstance.readFile(outputFileName);
    
    // Clean up files
    try {
        await ffmpegInstance.deleteFile(inputFileName);
        await ffmpegInstance.deleteFile(outputFileName);
    } catch (error) {
        console.warn('Failed to clean up files:', error);
    }

    return data as Uint8Array;
};

/**
 * Get video information using ffmpeg
 * @param file - The video file to analyze
 * @returns Video information
 */
export const getVideoInfo = async (file: File): Promise<string> => {
    const ffmpegInstance = await initializeFFmpeg();
    
    const inputFileName = `input.${file.name.split('.').pop() || 'mp4'}`;
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));
    
    // Get video info
    await ffmpegInstance.exec(['-i', inputFileName, '-f', 'null', '-']);
    
    // Clean up
    try {
        await ffmpegInstance.deleteFile(inputFileName);
    } catch (error) {
        console.warn('Failed to clean up file:', error);
    }
    
    return 'Video info logged to console';
};

/**
 * Convert video to different format
 * @param file - The video file to convert
 * @param outputFormat - Target format
 * @returns Converted video as Uint8Array
 */
export const convertVideo = async (
    file: File, 
    outputFormat: 'mp4' | 'webm' | 'avi' | 'mov'
): Promise<Uint8Array> => {
    const ffmpegInstance = await initializeFFmpeg();
    
    const inputFileName = `input.${file.name.split('.').pop() || 'mp4'}`;
    const outputFileName = `output.${outputFormat}`;
    
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));
    
    // Convert with appropriate codecs
    const args = ['-i', inputFileName];
    
    switch (outputFormat) {
        case 'mp4':
            args.push('-vcodec', 'libx264', '-acodec', 'aac');
            break;
        case 'webm':
            args.push('-vcodec', 'libvpx-vp9', '-acodec', 'libvorbis');
            break;
        case 'avi':
            args.push('-vcodec', 'libx264', '-acodec', 'mp3');
            break;
        case 'mov':
            args.push('-vcodec', 'libx264', '-acodec', 'aac');
            break;
    }
    
    args.push(outputFileName);
    
    await ffmpegInstance.exec(args);
    
    const data = await ffmpegInstance.readFile(outputFileName);
    
    // Clean up
    try {
        await ffmpegInstance.deleteFile(inputFileName);
        await ffmpegInstance.deleteFile(outputFileName);
    } catch (error) {
        console.warn('Failed to clean up files:', error);
    }
    
    return data as Uint8Array;
};

/**
 * Example usage function
 */
export const exampleUsage = async () => {
    // Example: Compress a video file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (file) {
        try {
            // Compress with custom options
            const compressed = await compressVideo(file, {
                crf: 25,
                maxWidth: 1920,
                maxHeight: 1080,
                format: 'mp4'
            });
            
            // Create download link
            const blob = new Blob([compressed], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_video.mp4';
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Compression failed:', error);
        }
    }
};