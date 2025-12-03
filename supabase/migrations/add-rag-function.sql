-- Vector similarity search function for knowledge_docs
create or replace function match_knowledge_docs(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  account_id uuid
)
returns table (
  id uuid,
  title text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_docs.id,
    knowledge_docs.title,
    knowledge_docs.content,
    1 - (knowledge_docs.embedding <=> query_embedding) as similarity
  from knowledge_docs
  where knowledge_docs.account_id = match_knowledge_docs.account_id
    and knowledge_docs.embedding is not null
    and 1 - (knowledge_docs.embedding <=> query_embedding) > match_threshold
  order by knowledge_docs.embedding <=> query_embedding
  limit match_count;
end;
$$;

