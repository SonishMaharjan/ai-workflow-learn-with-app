import type { Topic } from '../../types';

// Worked example: a small blog (posts + comments) built end-to-end, one layer at a time.
export const blog: Topic = {
id:'blog', icon:'📝', title:'Worked Example: Blog App with Posts & Comments', short:'Example: Blog App', tier:'project',
why:'Before the capstone, build something tiny and familiar end-to-end. A blog with posts and comments covers the core full-stack loop: a one-to-many relation in Postgres, a validated NestJS REST API, nested routes, and an Expo app that lists, creates and comments. Each step builds on the previous one, so you always have something that runs.',
steps:[
/* ---------------------------------------------------------- */
{title:'What we are building (and in what order)',
body:`<p>A minimal blog. Users can:</p>
<ol><li>See a list of blog posts (newest first)</li><li>Open a post and read its comments</li><li>Write a new post</li><li>Add a comment to a post</li></ol>
<h3>Data model</h3>
<p>One <b>Post</b> has many <b>Comments</b>. Each comment belongs to exactly one post. This is a <b>one-to-many</b> relation, and it is the most common shape you will meet in interviews and real apps.</p>
<pre><code>posts                            comments
-----------------                -----------------------------
id          uuid  PK     1 ──&lt; id          uuid  PK
title       text                 post_id     uuid  FK → posts.id
body        text                 author      text
author      text                 body        text
created_at  timestamptz          created_at  timestamptz
                                 (ON DELETE CASCADE)</code></pre>
<h3>API we will expose</h3>
<table><tr><th>Method</th><th>Path</th><th>Does</th></tr>
<tr><td>GET</td><td><code>/posts?limit=20&amp;cursor=...</code></td><td>List posts, newest first, paginated</td></tr>
<tr><td>GET</td><td><code>/posts/:id</code></td><td>One post + comment count</td></tr>
<tr><td>POST</td><td><code>/posts</code></td><td>Create a post</td></tr>
<tr><td>DELETE</td><td><code>/posts/:id</code></td><td>Delete a post (its comments go too)</td></tr>
<tr><td>GET</td><td><code>/posts/:id/comments</code></td><td>Comments for a post, oldest first</td></tr>
<tr><td>POST</td><td><code>/posts/:id/comments</code></td><td>Add a comment to a post</td></tr></table>
<h3>Build order: bottom-up, one layer per step</h3>
<p><b>Database → entities → DTOs → service → controller → test the API → mobile data layer → screens.</b> Every step leaves you with something runnable, so when something breaks you know which layer caused it.</p>
<div class="callout ai"><b>AI-first habit</b>Paste this whole step into Cursor as the <i>spec</i>, then ask for a plan. Do not let it write code until you have approved the plan. Implement one step per chat and commit after each one.</div>`,
prompt:`I am building a small blog: posts and comments (one post has many comments). Stack: NestJS + TypeORM + Postgres for the API, Expo (React Native) + TanStack Query for the app.
Endpoints: GET/POST /posts, GET/DELETE /posts/:id, GET/POST /posts/:id/comments.
Before writing any code, give me a step-by-step plan: folders, files per step, and how I can verify each step works. Wait for my approval.`},

/* ---------------------------------------------------------- */
{title:'Step 1 — Create the API and connect Postgres',
body:`<p><b>Goal:</b> a NestJS app that starts and connects to a local Postgres. There are no features yet; we only want to prove the wiring works.</p>
<ol><li>Start Postgres in Docker (you don't need to install it on your machine).</li>
<li>Scaffold the Nest project with the CLI.</li>
<li>Install TypeORM and the Postgres driver.</li>
<li>Read the DB settings from <code>.env</code> using <code>@nestjs/config</code>. Never hard-code credentials.</li>
<li>Register <code>TypeOrmModule.forRootAsync</code> in <code>AppModule</code>.</li></ol>
<div class="callout warn"><b>Why synchronize: false?</b><code>synchronize: true</code> auto-alters tables to match your entities. It's convenient, but it can silently drop columns and data. Keep it off from day one and use migrations (Step 2). Interviewers ask about this.</div>
<p><b>Check it works:</b> <code>npm run start:dev</code> starts with no connection errors.</p>`,
code:`# terminal
docker run -d --name blog-db -p 5432:5432 -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=blog postgres:16
npx @nestjs/cli new blog-api && cd blog-api
npm i @nestjs/typeorm typeorm pg @nestjs/config class-validator class-transformer

# .env
DATABASE_URL=postgres://postgres:dev@localhost:5432/blog

// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,   // picks up entities registered via forFeature()
        synchronize: false,       // schema changes go through migrations only
      }),
    }),
  ],
})
export class AppModule {}`,
prompt:`@src/app.module.ts Wire up TypeORM with Postgres using @nestjs/config and a DATABASE_URL env var. Use forRootAsync, autoLoadEntities: true and synchronize: false. Also add a .env.example file. Don't create any entities yet.`},

/* ---------------------------------------------------------- */
{title:'Step 2 — Entities (Post, Comment) and the first migration',
body:`<p><b>Goal:</b> describe both tables as TypeScript classes, then generate a migration that creates them.</p>
<h3>Key decisions, explained</h3>
<ul><li><code>@ManyToOne</code> on <b>Comment</b> creates the foreign key column <code>post_id</code>. The "many" side always owns the FK.</li>
<li><code>onDelete: 'CASCADE'</code> means deleting a post deletes its comments <i>in the database</i>. That's safer than looping in code, because it can't be forgotten.</li>
<li><code>@OneToMany</code> on <b>Post</b> is only for convenience in TypeScript. It adds no column.</li>
<li>Add an <b>index on <code>(post_id, created_at)</code></b>, because "comments for post X in order" is the query we'll run most often.</li>
<li>Use <code>timestamptz</code> so times are stored as UTC instants.</li></ul>
<p><b>Check it works:</b> run the migration, then check in your DB GUI that both tables and the FK exist.</p>`,
code:`// src/posts/post.entity.ts
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Comment } from '../comments/comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 200 }) title: string;
  @Column('text') body: string;
  @Column({ length: 80 }) author: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;

  @OneToMany(() => Comment, (c) => c.post) comments: Comment[];
}

// src/comments/comment.entity.ts
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from '../posts/post.entity';

@Entity('comments')
@Index(['postId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'post_id' }) postId: string;

  @ManyToOne(() => Post, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ length: 80 }) author: string;
  @Column('text') body: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

# terminal: generate + run the migration (needs a data-source.ts for the TypeORM CLI)
npx typeorm-ts-node-commonjs migration:generate src/migrations/CreatePostsAndComments -d src/data-source.ts
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts`,
prompt:`Create TypeORM entities Post and Comment (one-to-many). Comment owns a post_id FK with ON DELETE CASCADE and an index on (post_id, created_at). Use uuid PKs and timestamptz. Add src/data-source.ts for the TypeORM CLI and npm scripts migration:generate / migration:run. Then show me the generated migration SQL so I can review it before running it.`},

/* ---------------------------------------------------------- */
{title:'Step 3 — DTOs: validate what users send',
body:`<p><b>Goal:</b> never trust request bodies. A <b>DTO</b> (Data Transfer Object) describes exactly what a client may send. <code>class-validator</code> decorators reject anything else with a 400.</p>
<ul><li><code>whitelist: true</code> strips fields not listed in the DTO. For example, a client can't sneak in <code>id</code> or <code>createdAt</code>.</li>
<li><code>forbidNonWhitelisted: true</code> goes further and returns an error for unknown fields, which helps catch client bugs.</li>
<li><code>transform: true</code> turns query strings like <code>"20"</code> into numbers for you.</li>
<li>Keep DTOs separate from entities. The API contract and the table shape change for different reasons.</li></ul>
<p><b>Check it works:</b> POST an empty body later and you should get a 400 listing each broken rule.</p>`,
code:`// src/main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

// src/posts/dto/create-post.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
export class CreatePostDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsString() @IsNotEmpty() @MaxLength(20000) body: string;
  @IsString() @IsNotEmpty() @MaxLength(80) author: string;
}

// src/posts/dto/list-posts.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';
export class ListPostsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
  /** createdAt of the last post you already have (cursor pagination) */
  @IsOptional() @IsISO8601() cursor?: string;
}

// src/comments/dto/create-comment.dto.ts
export class CreateCommentDto {
  @IsString() @IsNotEmpty() @MaxLength(80) author: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) body: string;
}`,
prompt:`Add DTOs with class-validator: CreatePostDto (title, body, author), ListPostsDto (limit 1-50 default 20, optional ISO cursor) and CreateCommentDto (author, body). Enable a global ValidationPipe with whitelist, forbidNonWhitelisted and transform. Explain each option in one line.`},

/* ---------------------------------------------------------- */
{title:'Step 4 — Posts module: service + controller',
body:`<p><b>Goal:</b> working post CRUD. Split the responsibilities:</p>
<table><tr><th>Layer</th><th>Responsibility</th></tr>
<tr><td><b>Controller</b></td><td>HTTP only: route, params, DTOs, status codes. No SQL.</td></tr>
<tr><td><b>Service</b></td><td>Business logic + DB access via the repository. Throws <code>NotFoundException</code> etc.</td></tr>
<tr><td><b>Module</b></td><td>Registers the entity with <code>TypeOrmModule.forFeature</code> and wires things together through DI.</td></tr></table>
<h3>Why cursor pagination instead of page numbers?</h3>
<p><code>OFFSET 1000</code> makes Postgres read and discard 1000 rows, and new posts shift the pages so users see duplicates. With a cursor you say "give me 20 posts older than this timestamp". It uses the index and stays stable while new posts arrive. (In production, add <code>id</code> as a tie-breaker for posts with the same timestamp.)</p>
<p>Use <code>ParseUUIDPipe</code> on <code>:id</code> so a bad id returns 400 instead of a Postgres error that turns into a 500.</p>`,
code:`// src/posts/posts.service.ts
@Injectable()
export class PostsService {
  constructor(@InjectRepository(Post) private readonly posts: Repository<Post>) {}

  async list({ limit, cursor }: ListPostsDto) {
    const items = await this.posts.find({
      where: cursor ? { createdAt: LessThan(new Date(cursor)) } : {},
      order: { createdAt: 'DESC' },
      take: limit + 1,               // fetch one extra to know if there is a next page
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null };
  }

  async get(id: string) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    const commentCount = await this.posts.manager.count(Comment, { where: { postId: id } });
    return { ...post, commentCount };
  }

  create(dto: CreatePostDto) {
    return this.posts.save(this.posts.create(dto));
  }

  async remove(id: string) {
    const res = await this.posts.delete(id);   // comments removed by ON DELETE CASCADE
    if (!res.affected) throw new NotFoundException('Post not found');
  }
}

// src/posts/posts.controller.ts
@Controller('posts')
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Get() list(@Query() q: ListPostsDto) { return this.service.list(q); }
  @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) { return this.service.get(id); }
  @Post() create(@Body() dto: CreatePostDto) { return this.service.create(dto); }
  @Delete(':id') @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}

// src/posts/posts.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],     // CommentsModule will use it to check a post exists
})
export class PostsModule {}`,
prompt:`@src/posts Implement PostsModule with a service and controller: list (cursor pagination by createdAt, fetch limit+1 to compute nextCursor), get by id (404 if missing, include commentCount), create, delete (204, 404 if missing). Use ParseUUIDPipe for ids. Keep SQL out of the controller.`},

/* ---------------------------------------------------------- */
{title:'Step 5 — Comments: nested routes under a post',
body:`<p><b>Goal:</b> <code>GET/POST /posts/:postId/comments</code>. The URL shows the relationship: a comment only exists inside a post.</p>
<h3>Three details that matter</h3>
<ol><li><b>404 when the post doesn't exist.</b> Check it first with <code>PostsService.get</code> (reuse, don't duplicate). Otherwise you'd get a foreign key violation that shows up as a 500.</li>
<li><b>postId comes from the URL, never from the body.</b> The DTO doesn't even have a <code>postId</code> field, and <code>whitelist</code> strips it if a client sends one.</li>
<li><b>Order oldest → newest</b>, so the thread reads like a conversation. The <code>(post_id, created_at)</code> index from Step 2 makes this query fast.</li></ol>
<p>This module <b>imports</b> <code>PostsModule</code> to use its exported service. That's Nest dependency injection across modules.</p>`,
code:`// src/comments/comments.service.ts
@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    private readonly posts: PostsService,
  ) {}

  async listForPost(postId: string) {
    await this.posts.get(postId);                         // throws 404 if missing
    return this.comments.find({ where: { postId }, order: { createdAt: 'ASC' } });
  }

  async add(postId: string, dto: CreateCommentDto) {
    await this.posts.get(postId);
    return this.comments.save(this.comments.create({ ...dto, postId }));
  }
}

// src/comments/comments.controller.ts
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Get()
  list(@Param('postId', ParseUUIDPipe) postId: string) { return this.service.listForPost(postId); }

  @Post()
  add(@Param('postId', ParseUUIDPipe) postId: string, @Body() dto: CreateCommentDto) {
    return this.service.add(postId, dto);
  }
}

// src/comments/comments.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Comment]), PostsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}`,
prompt:`@src/posts @src/comments Add a CommentsModule with nested routes /posts/:postId/comments (GET list oldest-first, POST add). Reuse PostsService to 404 when the post is missing. postId must come only from the URL. Register the module in AppModule.`},

/* ---------------------------------------------------------- */
{title:'Step 6 — Prove the API works (curl + an e2e test)',
body:`<p><b>Goal:</b> have evidence that the API works before you touch the mobile app. Bugs are much cheaper to find here than through a UI.</p>
<ol><li>Try the happy path by hand with curl (or Bruno/Postman).</li>
<li>Try the <b>unhappy paths</b>: empty body → 400, random UUID → 404, non-UUID → 400, delete a post → its comments are gone.</li>
<li>Lock that behaviour in with an <b>e2e test</b> (Supertest). It runs against a real test database, so you're testing your real SQL too.</li></ol>
<div class="callout"><b>Interview soundbite</b>"For CRUD APIs I lean on e2e tests against a real Postgres. They catch relation, cascade and validation bugs that unit tests with mocked repositories miss."</div>`,
code:`# happy path
curl -s -X POST localhost:3000/posts -H 'Content-Type: application/json' \\
  -d '{"title":"Hello","body":"First post","author":"sonish"}'
curl -s localhost:3000/posts
curl -s -X POST localhost:3000/posts/<POST_ID>/comments -H 'Content-Type: application/json' \\
  -d '{"author":"alex","body":"Nice post!"}'
curl -s localhost:3000/posts/<POST_ID>/comments

# unhappy paths
curl -s -X POST localhost:3000/posts -H 'Content-Type: application/json' -d '{}'   # 400
curl -s localhost:3000/posts/00000000-0000-0000-0000-000000000000                 # 404

// test/blog.e2e-spec.ts
it('creates a post, comments on it, and cascades on delete', async () => {
  const post = await request(app.getHttpServer())
    .post('/posts').send({ title: 'T', body: 'B', author: 'me' }).expect(201);

  await request(app.getHttpServer())
    .post('/posts/' + post.body.id + '/comments').send({ author: 'you', body: 'hi' }).expect(201);

  const list = await request(app.getHttpServer()).get('/posts/' + post.body.id + '/comments').expect(200);
  expect(list.body).toHaveLength(1);

  await request(app.getHttpServer()).delete('/posts/' + post.body.id).expect(204);
  await request(app.getHttpServer()).get('/posts/' + post.body.id + '/comments').expect(404);
});

it('rejects invalid input', async () => {
  await request(app.getHttpServer()).post('/posts').send({}).expect(400);
  await request(app.getHttpServer()).post('/posts').send({ title: 'x', body: 'y', author: 'z', id: 'hack' }).expect(400);
});`,
prompt:`Write e2e tests (Jest + Supertest) for the blog API against a test Postgres database: create post, list with pagination (nextCursor), add + list comments, 404 for missing post, 400 for invalid body and unknown fields, and cascade delete. Tell me how to run them.`},

/* ---------------------------------------------------------- */
{title:'Step 7 — Mobile: API client + TanStack Query hooks',
body:`<p><b>Goal:</b> a typed data layer in the Expo app. Screens call hooks and never call <code>fetch</code> directly.</p>
<ul><li><b>Types</b> mirror the API responses. (Later you can generate them from OpenAPI, or share them in a monorepo.)</li>
<li><b>One small <code>api()</code> helper</b> handles the base URL, JSON and error handling.</li>
<li><b>TanStack Query</b> takes care of caching, loading/error states, refetching and pagination, so you don't write <code>useEffect</code> + <code>useState</code> for every request.</li>
<li><b>Query keys</b> like <code>['posts']</code> and <code>['comments', postId]</code> identify cached data. After a mutation succeeds, you <b>invalidate</b> the matching key so the list refreshes.</li></ul>
<div class="callout warn"><b>Emulator gotcha</b><code>localhost</code> on an Android emulator means the emulator itself. Use <code>10.0.2.2</code>, or your computer's LAN IP on a real phone. Put it in <code>EXPO_PUBLIC_API_URL</code>.</div>`,
code:`// npx create-expo-app@latest blog-app && npm i @tanstack/react-query

// src/api.ts
const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';

export interface Post { id: string; title: string; body: string; author: string; createdAt: string; commentCount?: number }
export interface Comment { id: string; postId: string; author: string; body: string; createdAt: string }
export interface Page<T> { items: T[]; nextCursor: string | null }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, { ...init, headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Request failed: ' + res.status);
  return res.status === 204 ? (undefined as T) : res.json();
}

// src/hooks.ts
export const usePosts = () =>
  useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => api<Page<Post>>('/posts?limit=20' + (pageParam ? '&cursor=' + pageParam : '')),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

export const usePost = (id: string) =>
  useQuery({ queryKey: ['post', id], queryFn: () => api<Post>('/posts/' + id) });

export const useComments = (postId: string) =>
  useQuery({ queryKey: ['comments', postId], queryFn: () => api<Comment[]>('/posts/' + postId + '/comments') });

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Pick<Post, 'title' | 'body' | 'author'>) =>
      api<Post>('/posts', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}`,
prompt:`In the Expo app, create src/api.ts (typed fetch helper using EXPO_PUBLIC_API_URL, throws on non-2xx with the server message) and src/hooks.ts with TanStack Query: usePosts (useInfiniteQuery with nextCursor), usePost, useComments, useCreatePost (invalidates ['posts']). Wrap the app in QueryClientProvider in app/_layout.tsx.`},

/* ---------------------------------------------------------- */
{title:'Step 8 — Screens: post list, post detail, new post',
body:`<p><b>Goal:</b> three screens using <b>Expo Router</b> (file-based routes, like Next.js):</p>
<table><tr><th>File</th><th>Route</th><th>Shows</th></tr>
<tr><td><code>app/index.tsx</code></td><td><code>/</code></td><td>FlatList of posts, pull-to-refresh, load more on scroll</td></tr>
<tr><td><code>app/posts/[id].tsx</code></td><td><code>/posts/abc</code></td><td>Post body + comments + comment form (Step 9)</td></tr>
<tr><td><code>app/new.tsx</code></td><td><code>/new</code></td><td>Form to create a post</td></tr></table>
<ul><li>Use <b>FlatList</b>, not <code>map</code> inside a ScrollView. It virtualises, so it only renders the rows on screen.</li>
<li>Handle all three states on every screen: <b>loading</b>, <b>error</b> (with retry), and <b>empty</b>.</li>
<li>In the form, disable the button while <code>isPending</code> so a double tap can't create two posts.</li></ul>`,
code:`// app/index.tsx - post list
export default function PostList() {
  const q = usePosts();
  const posts = q.data?.pages.flatMap((p) => p.items) ?? [];

  if (q.isPending) return <ActivityIndicator style={{ flex: 1 }} />;
  if (q.isError) return <ErrorView message={q.error.message} onRetry={q.refetch} />;

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/posts/[id]', params: { id: item.id } }} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>by {item.author} · {new Date(item.createdAt).toLocaleDateString()}</Text>
          </Pressable>
        </Link>
      )}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      refreshing={q.isRefetching}
      onRefresh={q.refetch}
      ListEmptyComponent={<Text style={styles.empty}>No posts yet. Write the first one!</Text>}
    />
  );
}

// app/new.tsx - create a post
export default function NewPost() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const create = useCreatePost();

  const submit = () =>
    create.mutate({ title, body, author: 'sonish' }, {
      onSuccess: (post) => router.replace({ pathname: '/posts/[id]', params: { id: post.id } }),
    });

  return (
    <View style={styles.form}>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Write something..." value={body} onChangeText={setBody} multiline style={[styles.input, { height: 160 }]} />
      {create.isError && <Text style={styles.error}>{create.error.message}</Text>}
      <Button title={create.isPending ? 'Publishing...' : 'Publish'} disabled={!title.trim() || !body.trim() || create.isPending} onPress={submit} />
    </View>
  );
}`,
prompt:`Using Expo Router, build app/index.tsx (FlatList of posts from usePosts with infinite scroll, pull-to-refresh, loading/error/empty states, each row links to /posts/[id]), app/new.tsx (title + body form using useCreatePost, disables while pending, navigates to the new post on success) and a header button on the list that opens /new.`},

/* ---------------------------------------------------------- */
{title:'Step 9 — Post detail + adding comments (optimistic update)',
body:`<p><b>Goal:</b> read a post, see its comments, and add one. The new comment should appear <b>instantly</b>.</p>
<h3>Optimistic update, step by step</h3>
<ol><li><b>onMutate</b>: cancel in-flight fetches for this key, save the current comments (snapshot), then add a temporary comment to the cache right away.</li>
<li><b>onError</b>: put the snapshot back (rollback) and show the error.</li>
<li><b>onSettled</b>: refetch from the server whether it worked or not, so the temporary comment is replaced by the real one (real <code>id</code>, real <code>createdAt</code>).</li></ol>
<p>Also invalidate <code>['post', id]</code> so the comment count updates.</p>
<div class="callout"><b>When NOT to be optimistic</b>For things that often fail, or where a wrong display costs something (payments, stock levels), wait for the server. A comment is low-risk, so optimistic is a good fit.</div>`,
code:`// src/hooks.ts
export function useAddComment(postId: string) {
  const qc = useQueryClient();
  const key = ['comments', postId];
  return useMutation({
    mutationFn: (input: { author: string; body: string }) =>
      api<Comment>('/posts/' + postId + '/comments', { method: 'POST', body: JSON.stringify(input) }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Comment[]>(key);
      const temp: Comment = { id: 'temp-' + Date.now(), postId, createdAt: new Date().toISOString(), ...input };
      qc.setQueryData<Comment[]>(key, (old = []) => [...old, temp]);
      return { previous };
    },
    onError: (_err, _input, ctx) => qc.setQueryData(key, ctx?.previous),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

// app/posts/[id].tsx
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const comments = useComments(id);
  const add = useAddComment(id);
  const [text, setText] = useState('');

  if (post.isPending) return <ActivityIndicator style={{ flex: 1 }} />;
  if (post.isError) return <ErrorView message={post.error.message} onRetry={post.refetch} />;

  const send = () => { add.mutate({ author: 'sonish', body: text.trim() }); setText(''); };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <FlatList
        data={comments.data ?? []}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View style={styles.post}>
            <Text style={styles.title}>{post.data.title}</Text>
            <Text style={styles.meta}>by {post.data.author}</Text>
            <Text style={styles.body}>{post.data.body}</Text>
            <Text style={styles.section}>{post.data.commentCount} comments</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.comment, item.id.startsWith('temp-') && { opacity: 0.5 }]}>
            <Text style={styles.meta}>{item.author}</Text>
            <Text>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput placeholder="Add a comment..." value={text} onChangeText={setText} style={styles.input} />
        <Button title="Send" disabled={!text.trim()} onPress={send} />
      </View>
    </KeyboardAvoidingView>
  );
}`,
prompt:`@src/hooks.ts @app/posts Build the post detail screen: header with the post, FlatList of comments, and a comment composer pinned to the bottom (KeyboardAvoidingView). Add useAddComment with an optimistic update (onMutate snapshot + temp comment, onError rollback, onSettled invalidate comments and post). Show temp comments at 50% opacity.`},

/* ---------------------------------------------------------- */
{title:'Step 10 — Make it real: auth, ownership, and what to add next',
body:`<p>You now have a working full-stack slice. Here's how it grows. Each item makes a good interview talking point:</p>
<table><tr><th>Next step</th><th>How</th></tr>
<tr><td><b>Real authors (auth)</b></td><td>Add a <code>users</code> table + JWT. Replace the <code>author</code> text column with an <code>author_id</code> FK. The author comes from <code>req.user</code>, <b>never from the body</b>.</td></tr>
<tr><td><b>Ownership rules</b></td><td>Only the post's author can delete it: in the service, check <code>post.authorId === user.id</code>, otherwise throw <code>ForbiddenException</code> (403).</td></tr>
<tr><td><b>Avoid N+1</b></td><td>To show comment counts in the list, use one grouped query (<code>loadRelationCountAndMap</code> or <code>COUNT ... GROUP BY</code>), not one query per post.</td></tr>
<tr><td><b>Edit / soft delete</b></td><td><code>PATCH</code> with a <code>PartialType(CreatePostDto)</code>. Add a <code>deletedAt</code> column with <code>@DeleteDateColumn</code> so deletes can be undone.</td></tr>
<tr><td><b>Replies (threads)</b></td><td>Add a nullable <code>parent_id</code> self-FK on comments.</td></tr>
<tr><td><b>Spam / abuse</b></td><td>Rate-limit comment creation (<code>@nestjs/throttler</code>). Keep the body length limits.</td></tr>
<tr><td><b>AI feature</b></td><td>"Summarise this thread" button: send the comments to an LLM and return a 2-line summary. Add a small eval set.</td></tr></table>
<div class="callout ai"><b>Your 60-second story</b>"I built a blog API and Expo app step by step with Cursor: entities and a migration first, then validated DTOs, a service/controller split, nested comment routes with 404 checks, and e2e tests against real Postgres. On mobile I used TanStack Query with cursor pagination and optimistic comments. The AI's first version put postId in the comment DTO — I caught it in review and added a rule that parent ids come from the URL."</div>`,
prompt:`Add JWT auth to the blog API: users table, register/login, a JwtAuthGuard on POST/DELETE routes. Replace author text with an authorId FK (write the migration, keeping existing data). Only the author may delete their post (403 otherwise). Plan first, then implement one step at a time.`},
],
questions:[
{q:'How would you model posts and comments in a relational database? Walk me through the tables and constraints.',lvl:1,points:['Two tables, one-to-many','FK post_id on comments (the many side owns it)','ON DELETE CASCADE (or soft delete)','Index on (post_id, created_at)','uuid / timestamptz / NOT NULL + length limits'],
a:'Two tables: posts and comments. Comments has a post_id foreign key to posts.id because the "many" side owns the relation. I would add ON DELETE CASCADE so deleting a post removes its comments at the database level, or use soft deletes if we need recovery. The main query is "comments for this post in order", so I index (post_id, created_at). I use uuid primary keys, timestamptz for times, NOT NULL on required columns and length limits that match the DTO validation.'},
{q:'Why nest the comments route under posts (/posts/:id/comments)? Where should postId come from?',lvl:1,points:['URL expresses the ownership/relationship','postId from the URL param, never the body','Validate it (ParseUUIDPipe) and 404 if the post is missing','whitelist strips extra fields'],
a:'A comment only makes sense inside a post, so the nested URL makes that relationship explicit and gives natural 404 semantics when the post does not exist. The postId must come only from the URL param: the DTO has no postId field, and ValidationPipe with whitelist strips anything extra, so a client cannot attach a comment to a different post. I validate the param with ParseUUIDPipe and check the post exists first, so the API returns 404 instead of a foreign key error surfacing as a 500.'},
{q:'Offset vs cursor pagination — which would you use for a feed of posts and why?',lvl:2,points:['OFFSET scans and discards rows → slow at depth','Offset pages shift when new rows are inserted → duplicates/skips','Cursor = "older than X", uses the index','Tie-breaker (created_at, id)','Offset still fine for small admin tables needing page numbers'],
a:'For a feed I would use cursor pagination. With OFFSET, Postgres still reads and discards all the skipped rows, so deep pages get slow, and new posts shift every page so users see duplicates or miss items. A cursor query such as WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 21 uses the index, costs the same at any depth and stays stable while new posts arrive. I fetch limit+1 to know whether there is a next page, and use (created_at, id) as the cursor so rows with the same timestamp are not skipped. Offset is still fine for small admin tables that need "page 7 of 12".'},
{q:'What is an optimistic update? How would you implement one for adding a comment, and when would you avoid it?',lvl:2,points:['Update UI before server confirms','Snapshot → set temp item → rollback on error','Invalidate/refetch on settle to get real id','Cancel in-flight queries first','Avoid when failure is common or costly (payments)'],
a:'An optimistic update shows the result in the UI before the server confirms it, so the app feels instant. With TanStack Query: in onMutate I cancel in-flight queries for the comments key, snapshot the current list and append a temporary comment with a temp id. In onError I restore the snapshot and show the error. In onSettled I invalidate the comments and the post so the real comment and count come from the server. I would avoid it where failures are common or a wrong display is costly, such as payments, inventory or anything needing server-side approval.'},
{q:'Your post list shows a comment count for each post and the endpoint is slow. What is likely wrong and how do you fix it?',lvl:2,points:['N+1: one count query per post','Use a single grouped query / loadRelationCountAndMap / subquery','Index on comments.post_id','Or a denormalised comment_count column updated in a transaction','Measure with query logging / EXPLAIN ANALYZE'],
a:'Most likely an N+1 problem: one query for the posts, then one COUNT per post. I would confirm it with TypeORM query logging, then replace it with a single query that joins or subqueries COUNT(*) grouped by post_id (TypeORM has loadRelationCountAndMap), backed by the index on comments.post_id. If the list is very hot, I would denormalise a comment_count column on posts and increment it in the same transaction that inserts a comment, then check the result with EXPLAIN ANALYZE.'},
{q:'How would you make sure only the author can delete their post?',lvl:2,points:['Authenticate (JWT guard) → req.user','authorId from the token, never the body','Authorisation check in the service: owner or 403','404 vs 403 trade-off (don\'t leak existence)','Test it: other user gets 403/404'],
a:'First authentication: a JWT guard on write routes puts the user on the request, and the post stores authorId taken from that user, never from the request body. Then authorisation in the service: load the post and throw ForbiddenException if post.authorId is not the current user id (or return 404 if we do not want to reveal the post exists). Doing the check in the service keeps it close to the data so other callers cannot bypass it. I would cover it with an e2e test where a second user tries to delete the post and is rejected.'},
{q:'Walk me through how you would build this blog feature with an AI coding tool without losing control of quality.',lvl:3,points:['Spec + plan first, approve before code','One layer per step, commit after each','Give context: @files, rules (DTOs, ids from URL)','Verify: read diffs, e2e tests, manual unhappy paths','Turn AI mistakes into rules/evals'],
a:'I start with a short spec (data model, endpoints, edge cases) and ask the agent for a plan before any code. Then I implement one layer per chat: entities and migration, DTOs, service and controller, comments, tests, then mobile. I commit after each step so I can roll back. I give precise context with @-mentions and project rules, for example "validate every body with a DTO" and "parent ids come from the URL". After each step I read the diff, run the e2e tests and try the unhappy paths myself. When the AI makes a mistake, such as putting postId in the comment DTO, I fix the code and also add a rule so it does not happen again.'},
]};
