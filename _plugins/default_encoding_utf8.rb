# frozen_string_literal: true

# Jekyll Scholar / bibtex-ruby read _bibliography/*.bib using Ruby's default external encoding.
# Without UTF-8, smart quotes and en-dashes in papers.bib raise "invalid byte sequence in US-ASCII".
Encoding.default_external = Encoding::UTF_8
