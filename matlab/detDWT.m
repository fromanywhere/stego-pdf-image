% S is a color or grayscale container
% sM = detDWT(S, 'db37')

function sM = detDWT(S, w)

S = double(S);

for t = 1:size(S, 3) % processing color channels
    U = S(:, :, t); % got channel slice
    [sA, sH, sV, sD] = dwt2(U, w, 'mode', 'per');
    sm{t}=(sD); % got replaced cD-coefficients
end

% strange code cause we got only red message channel for embedding
if size(S,3)==3
    sM=cat(3,sm{1},sm{2},sm{3});
else
    sM=sm{1};
end
