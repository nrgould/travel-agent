'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, FileText, Upload, X, Loader2 } from 'lucide-react';
import { LearningPath } from '@/lib/learning-path-schemas';
import { usePdfStore } from '@/store/pdf-store';

interface CreateLearningPathDialogProps {
	onPathCreated: (
		path: LearningPath,
		concept: string,
		gradeLevel: string,
		pathId?: string
	) => void;
	pdfId?: string;
	autoOpen?: boolean;
	triggerButton?: React.ReactNode;
	initialConcept?: string;
	initialGradeLevel?: string;
}

export function CreateLearningPathDialog({
	onPathCreated,
	pdfId,
	autoOpen = false,
	triggerButton,
	initialConcept = '',
	initialGradeLevel = '',
}: CreateLearningPathDialogProps) {
	const [open, setOpen] = useState(autoOpen);
	const [activeTab, setActiveTab] = useState(pdfId ? 'pdf' : 'description');
	const [concept, setConcept] = useState(initialConcept);
	const [gradeLevel, setGradeLevel] = useState(initialGradeLevel);
	const [description, setDescription] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const router = useRouter();

	// Get PDF from store
	const { pdfFile, clearPdf } = usePdfStore();

	// Set the PDF from the store if available
	useEffect(() => {
		if (pdfFile) {
			setFiles([pdfFile]);
			// Automatically switch to the PDF tab if we have a PDF
			setActiveTab('pdf');
		}
	}, [pdfFile]);

	// Set initial values from props
	useEffect(() => {
		if (initialConcept) {
			setConcept(initialConcept);
		}
		if (initialGradeLevel) {
			setGradeLevel(initialGradeLevel);
		}
	}, [initialConcept, initialGradeLevel]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFiles = Array.from(e.target.files);
			// Only accept PDF files
			const pdfFiles = selectedFiles.filter(
				(file) => file.type === 'application/pdf'
			);
			setFiles(pdfFiles);
		}
	};

	const clearPDF = () => {
		setFiles([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleCreateFromDescription = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!concept || !gradeLevel || !description) {
			setError('Please fill in all fields');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/learning-path', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					concept,
					gradeLevel,
					description,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to create learning path');
			}

			// Get the learning path ID from the response headers
			const learningPathId = response.headers.get('X-Learning-Path-Id');

			// Read the response as a stream
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let result = '';

			if (reader) {
				// Process the stream
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					result += chunk;

					// Update progress (approximate)
					setProgress((prev) => Math.min(prev + 10, 90));
				}
			}

			// Parse the final result
			const learningPath = JSON.parse(result);

			setProgress(100);

			// Close the dialog and notify parent
			setTimeout(() => {
				setOpen(false);
				onPathCreated(
					learningPath,
					concept,
					gradeLevel,
					learningPathId || undefined
				);

				// Reset form
				setConcept('');
				setGradeLevel('');
				setDescription('');
				setProgress(0);
				setIsLoading(false);

				// Navigate to the new learning path
				if (learningPathId) {
					router.push(`/learning-path/${learningPathId}`);
				}

				// Clear the PDF from store
				clearPdf();
			}, 500);
		} catch (error) {
			console.error('Error creating learning path:', error);
			setError('Failed to create learning path. Please try again.');
			setIsLoading(false);
			setProgress(0);
		}
	};

	const handleCreateFromPDF = async (e: React.FormEvent) => {
		e.preventDefault();
		if (files.length === 0) {
			setError('Please upload a PDF');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Create FormData to send files
			const formData = new FormData();
			formData.append('concept', concept || 'Auto-detected');
			formData.append('gradeLevel', gradeLevel || 'Auto-detected');

			// Append all files
			files.forEach((file) => {
				formData.append('files', file);
			});

			// Send the request
			const response = await fetch('/api/learning-path-from-pdf', {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Failed to create learning path from PDF');
			}

			// Get the learning path ID from the response headers
			const learningPathId = response.headers.get('X-Learning-Path-Id');

			// Read the response as a stream
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();
			let result = '';

			if (reader) {
				// Process the stream
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					result += chunk;

					// Update progress (approximate)
					setProgress((prev) => Math.min(prev + 5, 90));
				}
			}

			// Parse the final result
			const learningPath = JSON.parse(result);

			setProgress(100);

			// Close the dialog and notify parent
			setTimeout(() => {
				setOpen(false);
				onPathCreated(
					learningPath,
					concept,
					gradeLevel,
					learningPathId || undefined
				);

				// Reset form
				setConcept('');
				setGradeLevel('');
				setFiles([]);
				setProgress(0);
				setIsLoading(false);

				// Navigate to the new learning path
				if (learningPathId) {
					router.push(`/learning-path/${learningPathId}`);
				}

				// Clear the PDF from store
				clearPdf();
			}, 500);
		} catch (error) {
			console.error('Error creating learning path from PDF:', error);
			setError(
				'Failed to create learning path from PDF. Please try again.'
			);
			setIsLoading(false);
			setProgress(0);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{triggerButton || (
					<Button variant='outline' size='sm'>
						<Plus className='h-4 w-4 mr-2' />
						New Path
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='sm:max-w-[500px]'>
				<DialogHeader>
					<DialogTitle>Create Learning Path</DialogTitle>
					<DialogDescription>
						Create a new learning path to organize your learning
						journey.
					</DialogDescription>
				</DialogHeader>

				<Tabs
					defaultValue='description'
					value={activeTab}
					onValueChange={setActiveTab}
				>
					<TabsList className='grid w-full grid-cols-2'>
						<TabsTrigger value='description'>
							From Description
						</TabsTrigger>
						<TabsTrigger value='pdf'>From PDF</TabsTrigger>
					</TabsList>

					{/* Common fields for description tab only */}
					{activeTab === 'description' && (
						<div className='space-y-4 mt-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='concept'>
										Main Concept
									</Label>
									<Input
										id='concept'
										placeholder='e.g., Calculus, Machine Learning'
										value={concept}
										onChange={(e) =>
											setConcept(e.target.value)
										}
										disabled={isLoading}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='gradeLevel'>
										Grade Level
									</Label>
									<Input
										id='gradeLevel'
										placeholder='e.g., High School, College'
										value={gradeLevel}
										onChange={(e) =>
											setGradeLevel(e.target.value)
										}
										disabled={isLoading}
									/>
								</div>
							</div>
						</div>
					)}

					<TabsContent value='description' className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='description'>Description</Label>
							<Textarea
								id='description'
								placeholder='Describe what you want to learn...'
								className='min-h-[120px]'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								disabled={isLoading}
							/>
						</div>

						<Button
							onClick={handleCreateFromDescription}
							disabled={
								isLoading ||
								!concept ||
								!gradeLevel ||
								!description
							}
							className='w-full'
						>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Generating...
								</>
							) : (
								'Create Learning Path'
							)}
						</Button>
					</TabsContent>

					<TabsContent value='pdf' className='space-y-4 mt-4'>
						{/* Hidden concept and grade level fields for PDF tab */}
						<div className='hidden'>
							<Input
								id='concept-pdf'
								value={concept}
								onChange={(e) => setConcept(e.target.value)}
							/>
							<Input
								id='gradeLevel-pdf'
								value={gradeLevel}
								onChange={(e) => setGradeLevel(e.target.value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label>Upload PDF</Label>
							<div
								className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 transition-colors hover:border-muted-foreground/50 ${files.length > 0 ? 'bg-muted/10' : ''}`}
							>
								<input
									ref={fileInputRef}
									type='file'
									accept='.pdf'
									onChange={handleFileChange}
									className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
									id='pdf-upload'
									disabled={isLoading}
								/>
								{files.length > 0 ? (
									<div className='w-full'>
										{files.map((file, index) => (
											<div
												key={index}
												className='flex items-center justify-between bg-muted p-2 rounded mb-2'
											>
												<div className='flex items-center'>
													<FileText className='h-4 w-4 mr-2' />
													<span className='text-sm truncate max-w-[200px]'>
														{file.name}
													</span>
												</div>
												<Button
													variant='ghost'
													size='icon'
													onClick={(e) => {
														e.stopPropagation();
														e.preventDefault();
														clearPDF();
													}}
												>
													<X className='h-4 w-4' />
												</Button>
											</div>
										))}
									</div>
								) : (
									<>
										<Upload className='h-8 w-8 text-muted-foreground mb-2' />
										<p className='text-sm text-muted-foreground mb-1'>
											Drop your PDF here or click to
											browse
										</p>
										<p className='text-xs text-muted-foreground mt-2'>
											PDF files up to 5MB are supported
										</p>
									</>
								)}
							</div>
						</div>

						<Button
							onClick={handleCreateFromPDF}
							disabled={isLoading || files.length === 0}
							className='w-full'
						>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									Generating...
								</>
							) : (
								'Create Learning Path from PDF'
							)}
						</Button>
					</TabsContent>
				</Tabs>

				{isLoading && (
					<div className='space-y-2 mt-4'>
						<Progress value={progress} className='h-2' />
						<p className='text-xs text-center text-muted-foreground'>
							{progress < 100
								? 'Generating your learning path...'
								: 'Learning path created! Redirecting...'}
						</p>
					</div>
				)}

				{error && (
					<p className='text-sm text-destructive mt-2'>{error}</p>
				)}
			</DialogContent>
		</Dialog>
	);
}
