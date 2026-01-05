<template>
	<div class="page">
		<NavBar />
		<main class="container content">
			<slot />
		</main>
		<Footer />
	</div>
</template>

<style>
.page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.content {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding-top: 1rem;
	padding-bottom: 1rem;
}
</style>
